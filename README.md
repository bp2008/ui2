# UI2
A custom web interface for Blue Iris Video Security Software.

[![UI2 Screenshot](http://i.imgur.com/5Cszd3ym.png "UI2 Screenshot")](http://i.imgur.com/5Cszd3y.png)

## Discuss on ipcamtalk
This project has a discussion thread on the **ipcamtalk** forum, here:

https://ipcamtalk.com/threads/i-made-a-better-remote-live-view-page.93/


## Installation instructions

1. Download from the discussion thread above, where the latest release is linked.
   * Alternatively (e.g. if ipcamtalk is down), download it from [the releases page here on github](https://github.com/bp2008/ui2/releases).
2. Extract the files to the "www" folder located where BlueIris.exe resides.
3. Load the "ui2.htm" page.
   * http://localhost/ui2.htm - You will probably need to modify the URL to point at your Blue Iris machine.
   
   
## Tips
### Context Menu
If you long-press (click and hold) over a camera, a context menu will appear with options specific to that camera. This does not work on touchscreen devices, as I did not want to override the normal context menu there.

### The UI2 Settings Panel
UI2 has amassed a large number of settings, which are (poorly) organized in a settings panel that is accessible from the main menu (upper right corner of the UI).  Look through them some time, and you may find something you like.

### Settings Storage
UI2 settings are stored locally in the web browser in which you configured the settings.  Settings are not synchronized between other browsers or devices.  This includes the Server List, if you use it, and any settings you configure for the remote servers.

### H.264 Live Video
UI2 can stream live camera views with H.264 encoding, which results in higher frame rates and much more efficient use of bandwidth.  This is currently an experimental feature, and is slightly buggy.  It works only in Google Chrome, and only after you have configured your Blue Iris server appropriately.  But it is a lot better than Jpeg streaming if you are viewing remotely!  See UI2 Settings > HTML5 Canvas inside the UI for more information.

### PTZ Control
If you find and disable the `Safe PTZ` setting, PTZ controls will function more smoothly.

## Advanced Customization
If you know how to write JavaScript and CSS, you can modify UI2 without actually having to touch the default files.  This means you can download a UI2 update without needing to re-apply your changes to the default scripts.  Just create the files `/ui2/ui2-local-overrides.js` and/or `/ui2/ui2-local-overrides.css` and put your custom code in there.  UI2 will load them after all the other scripts and styles have loaded, so you can override any default behavior.  UI2 does not include default versions of these files, so they will not be overwritten when you download a UI2 update (disclaimer: back up your modifications in case I screw up and ship a release with my own copy of the overrides file included).  See `/ui2/ui2-local-overrides-template.js` for a template which can help with some simple modifications such as globally overriding the UI2 Settings.
