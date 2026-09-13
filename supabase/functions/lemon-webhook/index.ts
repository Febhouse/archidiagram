import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

// Polyfill for crypto in Deno Edge Functions is native
async function verifySignature(secret: string, signature: string, payload: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  // Convert hex signature to Uint8Array
  const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload)
  );
}

export default {
  // We use public access because Lemon Squeezy sends webhooks without Authorization headers
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    try {
      // 1. Verify the HTTP Method
      if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      // 2. Get the signature from headers
      const signature = req.headers.get('x-signature');
      if (!signature) {
        return new Response('Missing signature', { status: 401 });
      }

      // 3. Get the raw body for signature verification
      const rawBody = await req.text();
      
      // 4. Verify signature using the secret stored in Supabase Edge Secrets
      const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
      if (!webhookSecret) {
        console.error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET env var");
        return new Response('Server configuration error', { status: 500 });
      }

      const isValid = await verifySignature(webhookSecret, signature, rawBody);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response('Invalid signature', { status: 401 });
      }

      // 5. Parse the payload
      const payload = JSON.parse(rawBody);
      const eventName = payload.meta.event_name;
      const customData = payload.meta.custom_data || {};
      const userId = customData.user_id;

      console.log(`Received event: ${eventName} for user: ${userId}`);

      if (!userId) {
        // If there's no user_id, we can't tie it to a Supabase user. 
        // We still return 200 so Lemon Squeezy doesn't retry.
        console.log("No user_id found in custom_data. Skipping.");
        return new Response('OK', { status: 200 });
      }

      // 6. Handle Subscription Events
      let isPro = false;
      const subscriptionId = payload.data.id;
      const status = payload.data.attributes.status;
      const customerPortalUrl = payload.data.attributes.urls?.customer_portal || null;
      const renewsAt = payload.data.attributes.renews_at || null;

      // Statuses that mean the user has active access:
      // 'on_trial', 'active', 'past_due' (grace period)
      if (['subscription_created', 'subscription_updated'].includes(eventName)) {
        if (['on_trial', 'active', 'past_due'].includes(status)) {
          isPro = true;
        }
      } else if (eventName === 'subscription_expired') {
        isPro = false;
      }

      // 7. Update Supabase Database using the Admin Client (bypasses RLS)
      const { error } = await ctx.supabaseAdmin
        .from('profiles')
        .update({
          is_pro: isPro,
          subscription_id: subscriptionId,
          subscription_status: status,
          customer_portal_url: customerPortalUrl,
          renews_at: renewsAt,
        })
        .eq('id', userId);

      if (error) {
        console.error("Error updating profile:", error);
        return new Response('Error updating database', { status: 500 });
      }

      console.log(`Successfully updated profile ${userId} to is_pro: ${isPro}`);
      return new Response('Webhook processed successfully', { status: 200 });

    } catch (err) {
      console.error("Unhandled error processing webhook:", err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }),
};
