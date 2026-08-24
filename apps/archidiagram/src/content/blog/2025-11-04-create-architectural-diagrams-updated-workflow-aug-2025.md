---
title: 'Tutorial: Create Architectural Diagram with Sun Diagram & Dynamic Symbols'
description: 'In this tutorial, we’re sharing the updated workflow for creating an architectural diagram animation.'
pubDate: '2025-11-04T00:25:43+07:00'
heroImage: '/images/2025/11/SITEANALYSIS-COVER.jpg'
tags: 'tutorial'
software: 'SketchUp, Sun Diagram, Dynamic Symbols, Photoshop'
---

# Tutorial: Create an Architectural Diagram using SketchUp

This guide breaks down the complete process of creating dynamic architectural diagrams, from importing site data to generating animated shadow and symbol analysis videos using SketchUp and two free plugins: [**Sun Diagram**](https://sundiagram.com/) and [**Dynamic Symbols**](https://dynamicsymbols.com/)

https://www.youtube.com/watch?v=fqHZ3m-OYug

## Applicable for:

1. Site analysis diagrams
2. Sun path and shadow studies
3. Architectural diagram
4. and more

## Softwares used:

1. **SketchUp**: Modeling and editing 3D before export
2. **Sun Diagram Free**: <https://sundiagram.com/>
    
    or: <https://extensions.sketchup.com/extension/5aa1ab3d-36ff-4510-ae63-84f677a36f3a/sun-diagram>
3. **Dynamic Symbols Free:** [https://dynamicsymbols.com](https://dynamicsymbols.com/)
    
    or: <https://extensions.sketchup.com/extension/21085584-a984-474d-8407-33087adec402/dynamic-symbols>

 [ Reference Diagrams ](https://febhouse.com/diagrams/)

## All Resources used in the tutorial are included

All project files (2D + 3D) are included

 [ FREE DOWNLOAD ](https://assets.archidiagram.com/Samples/TUTORIAL-2D%2B3DFILES.zip)
 Let’s get started.

## Tutorial (step-by-step guide and videos):

[Step 1: Import Terrain and Map Data](#step1)  
[Step 2: Generate Contour Lines](#step2)  
[Step 3: Create a 3D Sun Path using Sun Diagram Plugin](#step3)  
[Step 4: Add Symbols with Dynamic Symbols Plugin](#step4)  
[Step 5: Create a Shadow Analysis using Sun Diagram](#step5)  
[Step 6: Generate dynamic symbols to represent the Site analysis](#step6)

[Final Result](#final)

**Let's get started !**

<a id="step1"></a>
## STEP 1: Import Terrain and Map Data

https://www.youtube.com/watch?v=BuSYwEcNwWo

1. Go to **File**, then **Add Location**.
2. Enter the location name or coordinates.
3. Click **Set Location**, then select **Add Context**.
4. Choose the elements you want to include: **Elevated site**, **Map texture**, and **Terrain mesh**.
5. Highlight the area you want to focus on and click **Import Site Context**.
6. SketchUp will automatically download terrain data and satellite maps

<a id="step2"></a>
## STEP 2: Create Contour Lines

https://www.youtube.com/watch?v=OWTfCmzZ7ww

1. Turn off the **House** and **Trees** tags, keeping only the **Terrain** model visible.
2. Draw rectangles at 10-meter intervals, perpendicular to the terrain.
3. Group them into **Components**.
4. Create evenly spaced rectangles every 5m and duplicate them 20 times.
5. Use **Intersect Faces, With Model** to generate intersections between the planes and terrain. These intersection lines become the contour lines.
6. Delete any unnecessary flat surfaces, keeping only the contour lines.
7. Highlight the contour lines by reducing the opacity of the satellite map texture.
8. To ensure shadow reception when the satellite map opacity is low, create another identical terrain layer, **Explode** it , fill it with **white**, and place it slightly below (e.g., 0.2m gap) the satellite image layer.
9. For uneven terrain, turn off the shadows cast onto the ground and keep only the shadows on the faces

<a id="step3"></a>
## STEP 3: Create a 3D Sun Path with Sun Diagram Plugin

https://www.youtube.com/watch?v=JuIJqWk_S0w

1. Search for **"Sun Diagram"** on the Extension Warehouse within SketchUp and install it.
2. Use the first feature of the plugin to create the 3D Sun Path.
3. Check if your region observes DST; select **"No"** for the DST option if it doesn't. (Note: Activating DST may require the Pro version ).
4. Move and scale the 3D Sun Path to fit your view; this won't affect the shadow results.
5. Select the display style of the diagram using the 4th feature of Sun Diagram (e.g., choose **Style 01** for a bright-style diagram).

<a id="step4"></a>
## STEP 4: Add Symbols (Wind, Views, etc.) with Dynamic Symbols Plugin

https://www.youtube.com/watch?v=VOl67HeTK8M

1. Install the free **Dynamic Symbols** plugin from the Extension Warehouse.
2. Use the first feature to generate a symbol.
3. Click **“Add”** on the symbol you want to use.
4. Rotate and scale it to fit your diagram.
5. Color the symbols using the 3rd feature of Dynamic Symbols, or use SketchUp’s default materials.

<a id="step5"></a>
## STEP 5: Create a Shadow Analysis using Sun Diagram

https://www.youtube.com/watch?v=XfVejlkLRRA

1. Turn off the **Dynamic Symbols** layer (tag).
2. Use the 3rd feature of Sun Diagram to perform the Shadow Analysis.
3. Select the time range.
4. Choose the image save location and set the image resolution.
5. Click **“Apply”** and wait for the plugin to export images for each time within the selected range.
6. Combine the images into a video using Photoshop, Capcut, or similar software.
7. In Photoshop, use the **"Load Files into Stack"** script to load all the images.
8. Use the **Timeline** feature, select all layers, and click **Create Video Timeline**.
9. Set the timeline frame rate to **1 frame per second**.
10. Use **Convert frame, make frame from clips**.
11. Export the file as a video.
12. Repeat the process for multiple months (e.g., December, June, and September).

<a id="step6"></a>
## STEP 6: Combine Images and Videos into a Final Animated Diagram

https://www.youtube.com/watch?v=XDDJ7J3_zsE

1. Turn off all layers, leaving only the **Dynamic Symbols** layer (or tag) visible.
2. Use Function 2 of the Dynamic Symbols plugin to animate them.
3. Select the symbols and click **"Create Scenes"**.
4. Check the **"Animation"** setting in **"Model Info"** and set the value to **1 second**.
5. Verify the changes by pressing **"Test Animation"**.
6. Set up only the desired scenes (e.g., **Feb_F1, Feb_F2, and Feb_F3**) to be checked for **"Include in Animation"**.
7. Go to **File**, **Export**, **Animation**.
8. Inside the Export Options, remember to **uncheck "Loop to starting scene".**
9. Click **OK** and wait for the software to export the video.
10. Open Photoshop or any video program to combine the videos.
11. Use **File, Scripts, Load Files into Stack** to choose and merge the two recently exported videos (Shadow Analysis and Dynamic Symbols).
12. Put the dynamic symbols video layer **above** the shadow analysis video layer.
13. Remove the white background of the dynamic symbols video layer using the **blending option** (slightly drag the white color handle of the current layer).
14. Reduce the opacity of the dynamic symbols video layer a little.
15. Export the final combined video.

<a id="final"></a>
## **Final Result** 

https://www.youtube.com/watch?v=fqHZ3m-OYug

[ FREE DOWNLOAD ](https://drive.google.com/file/d/1JIU6Nrvut1YXfP7HKgXJGSyCnz-pIZTU/view?usp=sharing)

That’s it! 🎉 You now have a complete architectural diagram animation combining Sun Diagram and Dynamic Symbols.

If you found this tutorial useful:  
👉 Leave a comment and share your results.  
👉 Follow us to get updates on new workflows and free resources.


