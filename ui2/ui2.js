/// <reference path="ui2-util.js" />
/// <reference path="ui2-local-overrides.js" />
/// <reference path="jquery-1.11.3.js" />
/// <reference path="jquery.ui2modal.js" />
var settings = null;
var allowUserToChangeSettings = true;
var settingsCategoryList = ["Video Streaming", "UI Behavior", "Top Bar", "Hotkeys", "HTML5 Canvas", "Camera Labels", "Servers", "Misc"]
var defaultSettings =
	[
		{
			key: "ui2_timeBetweenJpegImageUpdates"
			, value: 0
			, preLabel: "Jpeg refresh delay (ms):"
			, inputType: "number"
			, inputWidth: 80
			, minValue: 0
			, maxValue: 60000
			, hint: "[0-60000] A value of 0 will result in the highest frame rate, but also the highest bandwidth usage."
			, category: "Video Streaming"
		}
		, {
			key: "ui2_thumbnailLoadingThreads"
			, value: 3
			, inputType: "number"
			, inputWidth: 40
			, minValue: 1
			, maxValue: 5
			, preLabel: "Thumbnail loading concurrency:"
			, hint: "[1-5] (default: 3)<br/>Maximum number of connections for loading clip/alert thumbnails. Higher values will make thumbnails load faster, but may reduce video frame rate while thumbnails are loading."
			, onchange: onui2_thumbnailLoadingThreadsChanged
			, category: "Misc"
		}
		, {
			key: "ui2_hideTopBar"
			, value: "1"
			, preLabel: "Hide top bar when left bar is collapsed."
			, inputType: "checkbox"
			, hint: "If enabled, the top bar will be hidden when the left bar is fully collapsed."
			, onchange: resized
			, category: "Top Bar"
		}
		, {
			key: "ui2_audioAutoPlay"
			, value: "0"
			, preLabel: "Automatically play camera audio:"
			, inputType: "checkbox"
			, hint:
			'<div style="float:right;vertical-align:top;width:50px;">Audio Icons: '
			+ '<img src="ui2/high96.png" style="width:48px;height:48px;background-color:#377EC0" />'
			+ '<img src="ui2/mute96.png" style="width:48px;height:48px;background-color:#377EC0" />'
			+ "</div>"
			+ "Currently available only for live video streams.<br/><br/>"
			+ "Browser support varies:<br/>"
			+ "&bull; Chrome: Audio may be delayed<br/>"
			+ "&bull; Firefox: Good<br/>"
			+ "&bull; Internet Explorer: Not supported"
			, category: "Top Bar"
		}
		, {
			key: "ui2_safeptz"
			, value: "1"
			, preLabel: "Safe PTZ:"
			, inputType: "checkbox"
			, hint: "<b>IMPORTANT: If you have network trouble while using UNSAFE PTZ control, your camera may be stuck in a MOVING state.</b>"
			+ "<br/><br/>If you disable Safe PTZ, then you can hold the PTZ buttons down to move the camera smoothly (with most PTZ cameras).  "
			+ "<br/>This is considered less safe, because if you lose your connection to Blue Iris while you are moving the camera, the camera may continue moving until you are able to log back in and stop it. "
			+ "<br/><br/>With Safe PTZ enabled, each click simply moves the camera a predetermined amount."
			, category: "Top Bar"
		}
		, {
			key: "ui2_timeBetweenStatusUpdates"
			, value: 5000
			, preLabel: "Server status update interval (ms):"
			, inputType: "number"
			, inputWidth: 80
			, minValue: 1000
			, maxValue: 300000
			, hint: "[1000-300000] Server status includes the Stoplight, CPU, Memory, Profile, and Schedule information."
			, category: "Top Bar"
		}
		, {
			key: "ui2_enableDigitalZoom"
			, value: "1"
			, preLabel: "Digital Zoom:"
			, inputType: "checkbox"
			, hint: "If enabled, rolling the mouse wheel causes the video to zoom in and out."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_showSystemName"
			, value: "1"
			, preLabel: "System name in upper left:"
			, inputType: "checkbox"
			, hint: '<img src="ui2/logo.png" style="float:right;height:48px" />'
			+ "If enabled, the upper left corner of UI2 will show the system name from Blue Iris Options - About - System name. If disabled, the Blue Iris logo and the name \"UI2\" will be shown instead."
			, onchange: onui2_showSystemNameChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showStoplight"
			, value: "1"
			, preLabel: "Show Stoplight:"
			, inputType: "checkbox"
			, hint: '<div style="float:right;"><img alt="G" src="ui2/GreenLight96.png" style="height: 48px;" /></div>'
			+ "Shows a stoplight button similar to the one in the official Blue Iris apps."
			, onchange: onui2_showStoplightChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_enableStoplightButton"
			, value: "1"
			, preLabel: "Enable Stoplight Button:"
			, inputType: "checkbox"
			, hint: '<div style="float:right;"><img alt="G" src="ui2/GreenLight96.png" style="height: 48px;" /> '
			+ '<img alt="Y" src="ui2/YellowLight96.png" style="height: 48px;" /> '
			+ '<img alt="R" src="ui2/RedLight96.png" style="height: 48px;" /></div>'
			+ "If checked, clicking the Stoplight will toggle its state.<br/>"
			+ "Requires &quot;Show Stoplight&quot; to be checked.<br/>"
			+ "Requires administrator account."
			, onchange: onui2_enableStoplightButtonChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showQualityButton"
			, value: "1"
			, preLabel: "Show Quality Button:"
			, hint: '<div style="float:right;">'
			+ '<img src="ui2/scenery_high96.png" style="height:48px;background-color:#377EC0;" title="Indicates the quality is high (normal)" /> '
			+ '<img src="ui2/scenery_low96.png" style="height:48px;background-color:#C03737;" title="Indicates the quality is low (faster refresh)" /></div>'
			+ "Enables a button you can click to reduce image quality and improve frame rate.  Best used only on slow networks."
			, inputType: "checkbox"
			, onchange: onui2_showQualityButtonChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_currentImageQuality"
			, value: 1
		}
		, {
			key: "ui2_showCpuMem"
			, value: "1"
			, preLabel: "Show CPU/Memory:"
			, inputType: "checkbox"
			, onchange: onui2_showCpuMemChanged
			, hint: '<div style="float:right;font-style:normal;background-color:#373737">'
			+ 'CPU: <span style="color:#00CC00">40%</span><br/>'
			+ "MEM: 1.39G"
			+ "</div>"
			+ "Shows the Blue Iris server's CPU and Memory usage in a readout like this:"
			, category: "Top Bar"
		}
		, {
			key: "ui2_showProfile"
			, value: "1"
			, preLabel: "Show Profile Status:"
			, inputType: "checkbox"
			, onchange: onui2_showProfileChanged
			, hint: '<img src="ui2/ProfileExample.png" style="float:right" />'
			+ "Shows your current profile status in a readout like this:"
			, category: "Top Bar"
		}
		, {
			key: "ui2_enableProfileButtons"
			, value: "1"
			, preLabel: "Allow Profile Changes:"
			, inputType: "checkbox"
			, hint: "Enables you to click the profile status buttons to change profiles.<br/>Requires administrator account.<br/>Requires &quot;Show Profile Status&quot; to be checked."
			, onchange: onui2_enableProfileButtonsChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showSchedule"
			, value: "1"
			, preLabel: "Show Schedule Status:"
			, inputType: "checkbox"
			, hint: '<div style="float:right;font-style:normal;background-color:#373737;font-size:12px;line-height:18px">'
			+ '<span style="color:#999999;">Schedule:</span><br/>&nbsp;Default</div>'
			+ "Shows the currently selected schedule in a readout like this:"
			, onchange: onui2_showScheduleChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_enableScheduleButton"
			, value: "1"
			, preLabel: "Allow Schedule Changes:"
			, inputType: "checkbox"
			, hint: "Requires administrator account.<br/>Requires &quot;Show Schedule Status&quot; to be checked."
			, onchange: onui2_enableScheduleButtonChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showDiskInfo"
			, value: "0"
			, preLabel: "Show Disk Info:"
			, inputType: "checkbox"
			, hint: '<div style="float:right;font-style:normal;background-color:#373737;width:250px;">'
			+ 'Clips: 53197 files, 406.6G/1.00T; D: +864.4G</div>'
			+ "Shows the server's disk info in a readout like this:"
			, onchange: onui2_showDiskInfoChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_diskInfoWidth"
			, value: 250
			, preLabel: "Disk Info Width:"
			, inputType: "number"
			, inputWidth: 80
			, minValue: 10
			, maxValue: 999
			, stepSize: 1
			, hint: "[10-9999] (default: 250)<br/>Every system's Disk Info text can be a different size, so this option lets you resize the box."
			, onchange: onui2_diskInfoWidthChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_enableFrameRateCounter"
			, value: "0"
			, preLabel: "Show FPS"
			, inputType: "checkbox"
			, hint: 'Shows the current frames per second of the streaming video. This is not compatible with the experimental Frame Rate Boost option.'
			, onchange: onui2_enableFrameRateCounterChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showSaveSnapshotButton"
			, value: "1"
			, preLabel: "Show \"Save Snapshot\" Button:"
			, hint: '<div style="float:right;">'
			+ '<img style="height:48px;background-color:#377EC0;" alt="Save Snapshot" src="ui2/save_snapshot96.png" title="Download a frame to disk" /></div>'
			+ "Enables a button you can click to download the current frame to disk. Requires a browser with HTML5 canvas support."
			, inputType: "checkbox"
			, onchange: onui2_showSaveSnapshotButtonChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showHLSButton"
			, value: "1"
			, preLabel: "Show \"HLS\" Button:"
			, hint: '<div style="float:right;">'
			+ '<img style="height:48px;background-color:#377EC0;" alt="Save Snapshot" src="ui2/hls96.png" title="Open HLS Stream (H264, typically delayed about 10 seconds)" /></div>'
			+ "<p>Enables a button you can click to open an H264 live stream of the current camera or group, using the HLS streaming protocol.</p>"
			+ '<p><div style="color: #FF6666; font-weight: bold;">Hints:</div><div><ul>'
			+ "<li>HLS streaming may not work well in old browsers or with old Blue Iris versions.</li>"
			+ "<li>HLS streaming is normally delayed about 5 to 15 seconds longer than other viewing methods. The delay is unavoidable at this time.</li>"
			+ "<li>Some cameras with audio streams are not compatible, but some are.</li>"
			+ '<li>Jpeg refreshing is suppressed while an H264 live stream is open in front of the normal UI.</li>'
			+ '<li>You may configure the streaming parameters in Blue Iris. Open the Options, "Web server" tab, then choose Encoder profile "Streaming 0" and click "Configure".</li>'
			+ '<li>Right click the live H264 stream for an option to open the stream in a new tab. The new tab uses a page called "livestream.htm" with a "cam" parameter to tell it which camera or group to load. You can use the livestream.htm page separately, if you like!</li></ul></div></p>'
			, inputType: "checkbox"
			, onchange: onui2_showHLSButtonChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showPtzArrows"
			, value: "1"
			, preLabel: "Show PTZ Arrows"
			, inputType: "checkbox"
			, hint: 'Shows up/down/left/right arrows for PTZ cameras.<div style="float:right;"><img class="ptzbtn" src="ui2/up48.png" alt="^" /><img class="ptzbtn" src="ui2/left48.png" alt="<" /><img class="ptzbtn" src="ui2/down48.png" alt="v" /><img class="ptzbtn" src="ui2/right48.png" alt=">" /></div>'
			, onchange: onui2_showPtzArrowsChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showPtzZoom"
			, value: "1"
			, preLabel: "Show PTZ Zoom"
			, inputType: "checkbox"
			, hint: 'Shows zoom buttons for PTZ cameras.<div style="float:right;"><img class="ptzbtn" src="ui2/zoom_in48.png" alt="+" title="Zoom In" /><img class="ptzbtn"src="ui2/zoom_out48.png" alt="-" title="Zoom Out" /></div>'
			, onchange: onui2_showPtzZoomChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showPtzFocus"
			, value: "1"
			, preLabel: "Show PTZ Focus"
			, inputType: "checkbox"
			, hint: 'Shows focus buttons for PTZ cameras.<div style="float:right;"><img class="ptzbtn" src="ui2/focus_in48.png" alt="F+" title="Focus Near" /><img class="ptzbtn" src="ui2/focus_out48.png" alt="F-" title="Focus Far" /></div>'
			, onchange: onui2_showPtzFocusChanged
			, category: "Top Bar"
		}
		, {
			key: "ui2_showPtzPresetsGroup1"
			, value: "1"
			, preLabel: "Show PTZ Presets 1-10"
			, inputType: "checkbox"
			, hint: 'Shows PTZ preset buttons 1-10 for PTZ cameras.'
			, onchange: onui2_showPtzPresetsGroup1Changed
			, category: "Top Bar"
		}
		, {
			key: "ui2_showPtzPresetsGroup2"
			, value: "1"
			, preLabel: "Show PTZ Presets 11-20"
			, inputType: "checkbox"
			, hint: 'Shows PTZ preset buttons 11-20 for PTZ cameras.'
			, onchange: onui2_showPtzPresetsGroup2Changed
			, category: "Top Bar"
		}
		, {
			key: "ui2_showSystemLog"
			, value: "1"
			, preLabel: 'Show "System Log" in Menu'
			, inputType: "checkbox"
			, hint: '<div style="float:right;"><img class="icon24" src="ui2/log48.png" /></div>Shows the "System Log" option in the menu. The system log can only be viewed by administrators.'
			, category: "Top Bar"
		}
		, {
			key: "ui2_showSystemConfig"
			, value: "1"
			, preLabel: 'Show "System Configuration" in Menu'
			, inputType: "checkbox"
			, hint: '<div style="float:right;"><img class="icon24" src="ui2/sysconfig48.png" /></div>Shows the "System Configuration" option in the menu. The system configuration can only be viewed by administrators.'
			, category: "Top Bar"
		}
		, {
			key: "ui2_preferredClipList"
			, value: "cliplist"
		}
		, {
			key: "ui2_dpiScalingFactor"
			, value: 1
			, preLabel: "DPI scaling factor:"
			, inputType: "number"
			, inputWidth: 60
			, minValue: 0.1
			, maxValue: 10
			, stepSize: 0.1
			, hint: "[0.1-10] (default: 1.0)<br/>UI2 saves bandwidth by requesting video frames that will fit your screen.  "
			+ "However, <b>if your system uses DPI scaling</b>, UI2 may not be making good use of your extra pixels!  "
			+ "You may fix that here.<br/><br/>For example, if you use a typical Apple Retina Display (which has twice the standard DPI), "
			+ "then a value of 2 would be appropriate here.  If you aren't sure what to put here, try adjusting the number up and down in "
			+ "increments of 0.1 until you find a suitable balance between image quality and frame rate."
			, category: "Video Streaming"
		}
		, {
			key: "ui2_maxImageWidth"
			, value: 20000
			, preLabel: "Maximum image width to request:"
			, inputType: "number"
			, inputWidth: 80
			, minValue: 80
			, maxValue: 20000
			, category: "Video Streaming"
		}
		, {
			key: "ui2_maxImageHeight"
			, value: 20000
			, preLabel: "Maximum image height to request:"
			, inputType: "number"
			, inputWidth: 80
			, minValue: 45
			, maxValue: 20000
			, hint: "[45-20000] If you have extremely high resolution cameras, imposing width and height limits may improve performance at the cost of image quality.  "
			+ "Note that limiting the image size will also limit the usefulness of Digital Zoom."
			, category: "Video Streaming"
		}
		, {
			key: "ui2_useMjpeg"
			, value: "0"
			, preLabel: "Frame Rate Boost<br/><span style=\"color: #FF6666; font-weight: bold;\">Experimental &mdash; Not recommended for most users</span>"
			, inputType: "checkbox"
			, hint: "If enabled, UI2 will use MJPEG video instead of refreshing JPEG images.  In some cases, this will increase frame rates slightly.  But there are many undesirable side-effects which may result in frame rates actually going down.<br/><br/>"
			+ "<span style=\"color: #FF6666; font-weight: bold;\">Known Side Effects:</span><br/>"
			+ "&bull; Image size optimizations are disabled, leading to higher bandwidth usage.  Insufficient bandwidth causes the frame rate to go <b>down, not up</b>.<br/>"
			+ "&bull; DPI scaling factor and Jpeg refresh delay settings are disabled<br/>"
			+ "&bull; Camera-switching responsiveness is worse<br/>"
			+ "&bull; Camera auto-cycle gets locked to one aspect ratio.<br/>"
			+ "&bull; <span style=\"color: #FF6666; font-weight: bold;\">Video will freeze</span> whenever the MJPEG stream unexpectedly ends, because the browser does not notify UI2 when the stream ends.<br/>"
			+ "&bull; Does not work in all browsers.<br/>"
			+ "&bull; Some <span style=\"color: #FF6666; font-weight: bold;\">clip playback</span> features <span style=\"color: #FF6666; font-weight: bold;\">will not work</span>.<br/>"
			+ "&bull; &quot;Low Quality&quot; mode will not work.<br/>"
			+ "&bull; The FPS counter will not work (how is that for irony?)<br/>"
			+ "&bull; The \"Save Snapshot\" button will not work."
			, onchange: GetNewImage
			, category: "Video Streaming"
		}
		, {
			key: "ui2_lowQualityJpegQualityValue"
			, value: 20
			, preLabel: "Low Quality Jpeg Quality:"
			, inputType: "number"
			, inputWidth: 60
			, minValue: 0
			, maxValue: 100
			, stepSize: 1
			, hint: "[0-100] (default: 20)<br/>When &quot;Low Quality&quot; mode is enabled, jpeg encoding quality will be this."
			, category: "Video Streaming"
		}
		, {
			key: "ui2_lowQualityJpegSizeMultiplier"
			, value: 0.3
			, preLabel: "Low Quality Jpeg Scale:"
			, inputType: "number"
			, inputWidth: 60
			, minValue: 0.1
			, maxValue: 1
			, stepSize: 0.05
			, hint: "[0.1-1.0] (default: 0.3)<br/>When &quot;Low Quality&quot; mode is enabled, frames will be requested at this fraction of the normal size."
			, category: "Video Streaming"
		}
		, {
			key: "ui2_defaultCameraGroupId"
			, value: "index"
		}
		, {
			key: "ui2_leftBarSize"
			, value: 210
		}
		, {
			key: "ui2_autoLoadClipList"
			, value: "0"
		}
		, {
			key: "ui2_storedLoginConverted"
			, value: ""
		}
		, {
			key: "bi_username"
			, value: ""
		}
		, {
			key: "bi_password"
			, value: ""
		}
		, {
			key: "bi_rememberMe"
			, value: "0"
			, preLabel: "Log in automatically"
			, inputType: "checkbox"
			, hint: "If checked, your login credentials will be remembered and you will be logged in automatically."
			, onchange: onbi_rememberMeChanged
			, category: "Misc"
		}
		, {
			key: "ui2_clipPlaybackSpeed"
			, value: "1"
		}
		, {
			key: "ui2_clipPlaybackSeekBarEnabled"
			, value: "1"
			, preLabel: "Enable Seek Bar"
			, inputType: "checkbox"
			, hint: "If you are using Blue Iris 3 and experiencing clip playback issues, you should disable this."
			, onchange: onui2_clipPlaybackSeekBarEnabledChanged
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipPlaybackLoopEnabled"
			, value: "0"
		}
		, {
			key: "ui2_clipPlaybackAutoplayEnabled"
			, value: "0"
		}
		, {
			key: "ui2_clipPlaybackControlsMayAppearOnTopBar"
			, value: "1"
			, preLabel: "Playback controls may appear in the top bar:"
			, inputType: "checkbox"
			, hint: "If enabled, the playback controls will prefer to appear in the top bar, as long as there is room."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipPlaybackControlsMayAppearOnTop"
			, value: "0"
			, preLabel: "Playback controls may appear on top of video:"
			, inputType: "checkbox"
			, hint: "If checked, the playback controls may be overlayed over the top of the video."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipPlaybackControlsMayAppearOnBottom"
			, value: "1"
			, preLabel: "Playback controls may appear on bottom of video:"
			, inputType: "checkbox"
			, hint: "If checked, the playback controls may be overlayed over the bottom of the video."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipPlaybackControlsDisappearWhenCursorIsFar"
			, value: "1"
			, preLabel: "Playback controls disappear when cursor is far away:"
			, inputType: "checkbox"
			, hint: "If checked, the playback controls will fade away depending on the distance to the mouse cursor.<br/>Has no effect if the playback controls are in the top bar."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipPlaybackControlsMinimumOpacity"
			, value: 50
			, inputType: "number"
			, inputWidth: 40
			, minValue: 0
			, maxValue: 100
			, preLabel: "Playback controls minimum opacity:"
			, hint: "[0-100] (default: 50)<br/>If greater than 0, the playback controls will stay partially visible no matter how far away the mouse cursor is."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_autoplayReverse"
			, value: "0"
			, preLabel: "Autoplay Reverse"
			, inputType: "checkbox"
			, hint: "Reverses the order of clip traversal when autoplay is enabled.<br/>"
			+ '(Autoplay is the <img src="ui2/squares48.png" style="background-color:#377EC0;width:24px;height:24px;" /> button)'
			, category: "UI Behavior"
		}
		, {
			key: "ui2_alertDelete_requiresConfirmation"
			, value: "1"
			, preLabel: "Alert delete requires confirmation"
			, inputType: "checkbox"
			, hint: 'Deleting an alert can require Yes/No confirmation. (Left-click-and-hold an alert in the alert list to see the delete button)'
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipDelete_requiresConfirmation"
			, value: "1"
			, preLabel: "Clip delete requires confirmation"
			, inputType: "checkbox"
			, hint: 'Deleting a clip can require Yes/No confirmation. (Left-click-and-hold a clip in the clip list to see the delete button)'
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipListZoom"
			, value: "1"
			, preLabel: "Clip list zooms when resized"
			, inputType: "checkbox"
			, hint: '(Default: checked)'
			, onchange: HandleClipListZoom
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipListZoomMultiplier"
			, value: 1
			, preLabel: "Clip list zoom multiplier"
			, inputType: "number"
			, inputWidth: 40
			, minValue: 0.1
			, maxValue: 10
			, stepSize: 0.1
			, hint: '(Default: 1) The clip list zoom level will be adjusted by this much. Try a value of 2.1 to show only thumbnails.'
			, onchange: HandleClipListZoom
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipPreviewEnabled"
			, value: "1"
			, preLabel: "Clip preview animation enabled"
			, inputType: "checkbox"
			, hint: 'If checked, mousing over a clip will cause the thumbnail to play a preview of the clip. While this animation is active, the frame rate of the main video area may be reduced.<br/><br/>* This feature is always disabled on touchscreen devices due to the lack of proper "hover" logic.'
			, category: "UI Behavior"
		}
		, {
			key: "ui2_clipsShowSnapshots"
			, value: "1"
			, preLabel: "Show Recorded Snapshots"
			, inputType: "checkbox"
			, hint: 'If checked, the clip list will include Snapshots. If unchecked, only video clips will be shown.<br/>* You must reload the clip list for this setting to take effect.'
			, category: "UI Behavior"
		}
		, {
			key: "ui2_snapshotPlaybackTimeSeconds"
			, value: 2
			, preLabel: "Snapshot Playback Time:"
			, postLabel: " seconds"
			, inputType: "number"
			, inputWidth: 60
			, minValue: 0
			, maxValue: 60
			, stepSize: 0.5
			, hint: '[0-60] Clips of type "Snapshot" will display for this long when auto-playing clips.<br/>* You must reload the clip list for this setting to take effect.'
			, category: "UI Behavior"
		}
		, {
			key: "ui2_timeBetweenCameraListUpdates"
			, value: 5000
			, preLabel: "Camera list update interval (ms):"
			, inputType: "number"
			, inputWidth: 80
			, minValue: 1000
			, maxValue: 300000
			, hint: "[1000-300000] The camera list will update periodically to help keep this page in sync with Blue Iris."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_sessionTimeout"
			, value: 0
			, preLabel: "Session Timeout (minutes):"
			, inputType: "number"
			, minValue: 0
			, maxValue: 1440
			, stepSize: 1
			, hint: "(Default: 0) [0-1440] The number of minutes a user can be idle before the UI logs out automatically. 0 means no timeout."
			, category: "UI Behavior"
		}
		, {
			key: "ui2_enableHotkeys"
			, value: "1"
			, inputType: "checkbox"
			, preLabel: "Enable Hotkeys:"
			, hint: "You may not disable individual hotkeys, but you can assign key combinations you will never use, such as CTRL + ALT + SHIFT + PAUSE."
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_togglefullscreen"
			, value: "1|0|0|192|tilde (~`)"
			, hotkey: true
			, preLabel: "Toggle Full Screen:"
			, hint: "Toggles the browser between full screen and windowed mode.  Most browsers also go fullscreen when you press F11, regardless of what you set here."
			, hotkeyAction: Hotkey_ToggleFullscreen
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_togglesidebar"
			, value: "0|0|0|192|tilde (~`)"
			, hotkey: true
			, preLabel: "Show/Hide Side Bar:"
			, hint: "Toggles visibility of the side bar."
			, hotkeyAction: Hotkey_ToggleSidebar
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_togglecameralabels"
			, value: "1|0|0|76|L"
			, hotkey: true
			, preLabel: "Toggle Camera Labels:"
			, hint: 'Enables and disables camera labels. You can configure camera labels in the "Camera Labels" section.'
			, hotkeyAction: Hotkey_ToggleCameraLabels
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_downloadframe"
			, value: "1|0|0|83|S"
			, hotkey: true
			, preLabel: "Download frame:"
			, hint: 'Downloads the current frame to disk, the same as if you clicked the button.<div style="float:right;">'
			+ '<img style="height:48px;background-color:#377EC0;" alt="Save Snapshot" src="ui2/save_snapshot96.png" title="Download a frame to disk" /></div>'
			, hotkeyAction: Hotkey_DownloadFrame
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_playpause"
			, value: "0|0|0|32|space"
			, hotkey: true
			, preLabel: "Play/Pause:"
			, hint: '<div style="float:right;vertical-align:top;background-color:#373737">'
			+ '<img src="ui2/play48.png" style="width:24px;height:24px;background-color:#377EC0;margin-right:10px" />'
			+ '<img src="ui2/pause48.png" style="width:24px;height:24px;background-color:#377EC0" />'
			+ "</div>"
			+ "Plays or pauses the current recording."
			, hotkeyAction: Hotkey_PlayPause
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_newerClip"
			, value: "0|0|0|38|up arrow"
			, hotkey: true
			, preLabel: "Next Clip:"
			, hint: '<img src="ui2/NextClip.png" style="float:right;height:48px" />'
			+ "Load the next clip, higher up in the list:"
			, hotkeyAction: Hotkey_NextClip
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_olderClip"
			, value: "0|0|0|40|down arrow"
			, hotkey: true
			, preLabel: "Previous Clip:"
			, hint: '<img src="ui2/PreviousClip.png" style="float:right;height:48px" />'
			+ "Load the previous clip, lower down in the list:"
			, hotkeyAction: Hotkey_PreviousClip
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_skipAhead"
			, value: "0|0|0|39|right arrow"
			, hotkey: true
			, preLabel: "Skip Ahead:"
			, hint: "Skips ahead in the current recording by a configurable number of seconds."
			, hotkeyAction: Hotkey_SkipAhead
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_skipBack"
			, value: "0|0|0|37|left arrow"
			, hotkey: true
			, preLabel: "Skip Back:"
			, hint: "Skips back in the current recording by a configurable number of seconds."
			, hotkeyAction: Hotkey_SkipBack
			, category: "Hotkeys"
		}
		, {
			key: "ui2_skipAmount"
			, value: 10
			, inputType: "number"
			, inputWidth: 40
			, minValue: 1
			, maxValue: 9999
			, preLabel: "Skip time:"
			, hint: "[1-9999] (default: 10)<br/>Number of seconds to skip forward and back when using hotkeys to skip."
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_playbackFaster"
			, value: "1|0|0|39|right arrow"
			, hotkey: true
			, preLabel: "Play Faster:"
			, hint: '<img src="ui2/fast48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "Increases clip playback speed."
			, hotkeyAction: Hotkey_PlayFaster
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_playbackSlower"
			, value: "1|0|0|37|left arrow"
			, hotkey: true
			, preLabel: "Play Slower:"
			, hint: '<img src="ui2/slow48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "Decreases clip playback speed."
			, hotkeyAction: Hotkey_PlaySlower
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_playbackForwardReverse"
			, value: "1|0|0|32|space"
			, hotkey: true
			, preLabel: "Toggle Forward/Reverse:"
			, hint: '<div style="float:right;vertical-align:top;background-color:#373737">'
			+ '<img src="ui2/fastforward48.png" style="width:24px;height:24px;background-color:#377EC0;margin-right:10px" />'
			+ '<img src="ui2/rewind48.png" style="width:24px;height:24px;background-color:#377EC0" />'
			+ "</div>"
			+ "Toggles betweeen forward and reverse clip playback."
			, hotkeyAction: Hotkey_PlayForwardReverse
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_digitalZoomIn"
			, value: "0|0|1|187|="
			, hotkey: true
			, preLabel: "Digital Zoom In:"
			, hint: "This has the same function as rolling a mouse wheel upward."
			, hotkeyAction: Hotkey_DigitalZoomIn
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_digitalZoomOut"
			, value: "0|0|1|189|-"
			, hotkey: true
			, preLabel: "Digital Zoom Out:"
			, hint: "This has the same function as rolling a mouse wheel downward."
			, hotkeyAction: Hotkey_DigitalZoomOut
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_digitalPanUp"
			, value: "0|0|1|38|up arrow"
			, hotkey: true
			, preLabel: "Digital Pan Up:"
			, hint: "If zoomed in with digital zoom, pans up."
			, hotkeyAction: Hotkey_DigitalPanUp
			, hotkeyUpAction: Hotkey_DigitalPanUp_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_digitalPanDown"
			, value: "0|0|1|40|down arrow"
			, hotkey: true
			, preLabel: "Digital Pan Down:"
			, hint: "If zoomed in with digital zoom, pans down."
			, hotkeyAction: Hotkey_DigitalPanDown
			, hotkeyUpAction: Hotkey_DigitalPanDown_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_digitalPanLeft"
			, value: "0|0|1|37|left arrow"
			, hotkey: true
			, preLabel: "Digital Pan Left:"
			, hint: "If zoomed in with digital zoom, pans left."
			, hotkeyAction: Hotkey_DigitalPanLeft
			, hotkeyUpAction: Hotkey_DigitalPanLeft_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_digitalPanRight"
			, value: "0|0|1|39|right arrow"
			, hotkey: true
			, preLabel: "Digital Pan Right:"
			, hint: "If zoomed in with digital zoom, pans right."
			, hotkeyAction: Hotkey_DigitalPanRight
			, hotkeyUpAction: Hotkey_DigitalPanRight_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzUp"
			, value: "0|0|0|38|up arrow"
			, hotkey: true
			, preLabel: "PTZ Up:"
			, hint: '<img src="ui2/up48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera up."
			, hotkeyAction: Hotkey_PtzUp
			, hotkeyUpAction: Hotkey_PtzUp_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzDown"
			, value: "0|0|0|40|down arrow"
			, hotkey: true
			, preLabel: "PTZ Down:"
			, hint: '<img src="ui2/down48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera down."
			, hotkeyAction: Hotkey_PtzDown
			, hotkeyUpAction: Hotkey_PtzDown_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzLeft"
			, value: "0|0|0|37|left arrow"
			, hotkey: true
			, preLabel: "PTZ Left:"
			, hint: '<img src="ui2/left48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera left."
			, hotkeyAction: Hotkey_PtzLeft
			, hotkeyUpAction: Hotkey_PtzLeft_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzRight"
			, value: "0|0|0|39|right arrow"
			, hotkey: true
			, preLabel: "PTZ Right:"
			, hint: '<img src="ui2/right48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, moves the camera right."
			, hotkeyAction: Hotkey_PtzRight
			, hotkeyUpAction: Hotkey_PtzRight_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzIn"
			, value: "0|0|0|187|="
			, hotkey: true
			, preLabel: "PTZ Zoom In:"
			, hint: '<img src="ui2/zoom_in48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, zooms the camera in."
			, hotkeyAction: Hotkey_PtzIn
			, hotkeyUpAction: Hotkey_PtzIn_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzOut"
			, value: "0|0|0|189|-"
			, hotkey: true
			, preLabel: "PTZ Zoom Out:"
			, hint: '<img src="ui2/zoom_out48.png" style="float:right;width:24px;height:24px;background-color:#377EC0" />'
			+ "If the current live camera is PTZ, zooms the camera out."
			, hotkeyAction: Hotkey_PtzOut
			, hotkeyUpAction: Hotkey_PtzOut_Up
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset1"
			, value: "0|0|0|49|1"
			, hotkey: true
			, preLabel: "Load Preset 1:"
			, hint: "If the current live camera is PTZ, loads preset 1."
			, hotkeyAction: function () { Hotkey_PtzPreset(1); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset2"
			, value: "0|0|0|50|2"
			, hotkey: true
			, preLabel: "Load Preset 2:"
			, hint: "If the current live camera is PTZ, loads preset 2."
			, hotkeyAction: function () { Hotkey_PtzPreset(2); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset3"
			, value: "0|0|0|51|3"
			, hotkey: true
			, preLabel: "Load Preset 3:"
			, hint: "If the current live camera is PTZ, loads preset 3."
			, hotkeyAction: function () { Hotkey_PtzPreset(3); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset4"
			, value: "0|0|0|52|4"
			, hotkey: true
			, preLabel: "Load Preset 4:"
			, hint: "If the current live camera is PTZ, loads preset 4."
			, hotkeyAction: function () { Hotkey_PtzPreset(4); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset5"
			, value: "0|0|0|53|5"
			, hotkey: true
			, preLabel: "Load Preset 5:"
			, hint: "If the current live camera is PTZ, loads preset 5."
			, hotkeyAction: function () { Hotkey_PtzPreset(5); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset6"
			, value: "0|0|0|54|6"
			, hotkey: true
			, preLabel: "Load Preset 6:"
			, hint: "If the current live camera is PTZ, loads preset 6."
			, hotkeyAction: function () { Hotkey_PtzPreset(6); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset7"
			, value: "0|0|0|55|7"
			, hotkey: true
			, preLabel: "Load Preset 7:"
			, hint: "If the current live camera is PTZ, loads preset 7."
			, hotkeyAction: function () { Hotkey_PtzPreset(7); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset8"
			, value: "0|0|0|56|8"
			, hotkey: true
			, preLabel: "Load Preset 8:"
			, hint: "If the current live camera is PTZ, loads preset 8."
			, hotkeyAction: function () { Hotkey_PtzPreset(8); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset9"
			, value: "0|0|0|57|9"
			, hotkey: true
			, preLabel: "Load Preset 9:"
			, hint: "If the current live camera is PTZ, loads preset 9."
			, hotkeyAction: function () { Hotkey_PtzPreset(9); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset10"
			, value: "0|0|0|48|0"
			, hotkey: true
			, preLabel: "Load Preset 10:"
			, hint: "If the current live camera is PTZ, loads preset 10."
			, hotkeyAction: function () { Hotkey_PtzPreset(10); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset11"
			, value: "1|0|0|49|1"
			, hotkey: true
			, preLabel: "Load Preset 11:"
			, hint: "If the current live camera is PTZ, loads preset 11."
			, hotkeyAction: function () { Hotkey_PtzPreset(11); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset12"
			, value: "1|0|0|50|2"
			, hotkey: true
			, preLabel: "Load Preset 12:"
			, hint: "If the current live camera is PTZ, loads preset 12."
			, hotkeyAction: function () { Hotkey_PtzPreset(12); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset13"
			, value: "1|0|0|51|3"
			, hotkey: true
			, preLabel: "Load Preset 13:"
			, hint: "If the current live camera is PTZ, loads preset 13."
			, hotkeyAction: function () { Hotkey_PtzPreset(13); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset14"
			, value: "1|0|0|52|4"
			, hotkey: true
			, preLabel: "Load Preset 14:"
			, hint: "If the current live camera is PTZ, loads preset 14."
			, hotkeyAction: function () { Hotkey_PtzPreset(14); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset15"
			, value: "1|0|0|53|5"
			, hotkey: true
			, preLabel: "Load Preset 15:"
			, hint: "If the current live camera is PTZ, loads preset 15."
			, hotkeyAction: function () { Hotkey_PtzPreset(15); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset16"
			, value: "1|0|0|54|6"
			, hotkey: true
			, preLabel: "Load Preset 16:"
			, hint: "If the current live camera is PTZ, loads preset 16."
			, hotkeyAction: function () { Hotkey_PtzPreset(16); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset17"
			, value: "1|0|0|55|7"
			, hotkey: true
			, preLabel: "Load Preset 17:"
			, hint: "If the current live camera is PTZ, loads preset 17."
			, hotkeyAction: function () { Hotkey_PtzPreset(17); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset18"
			, value: "1|0|0|56|8"
			, hotkey: true
			, preLabel: "Load Preset 18:"
			, hint: "If the current live camera is PTZ, loads preset 18."
			, hotkeyAction: function () { Hotkey_PtzPreset(18); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset19"
			, value: "1|0|0|57|9"
			, hotkey: true
			, preLabel: "Load Preset 19:"
			, hint: "If the current live camera is PTZ, loads preset 19."
			, hotkeyAction: function () { Hotkey_PtzPreset(19); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_hotkey_ptzPreset20"
			, value: "1|0|0|48|0"
			, hotkey: true
			, preLabel: "Load Preset 20:"
			, hint: "If the current live camera is PTZ, loads preset 20."
			, hotkeyAction: function () { Hotkey_PtzPreset(20); }
			, category: "Hotkeys"
		}
		, {
			key: "ui2_clipListDateUseLocale"
			, value: "0"
			, preLabel: "Locale format clip timestamps"
			, inputType: "checkbox"
			, hint: 'If checked, clip and alert lists will use a locale-specific date format which varies by country, region, or language. By default, UI2 uses a standardized format because the locale format may not fit in the allotted space. Reload the clip or alert list for this to take effect.<br/>'
			+ '<br/>&nbsp;&nbsp;Standard format: ' + GetDateStr(new Date())
			+ '<br/>&nbsp;&nbsp;&nbsp;&nbsp;Locale format: ' + new Date().toLocaleString()
			, category: "Misc"
		}
		, {
			key: "ui2_lastLoadedVersion"
			, value: (typeof ui2_version == "undefined" || ui2_version == null ? "0.12.4" : ui2_version)
		}
		, {
			key: "ui2_lastUpdateCheck"
			, value: 0
		}
		, {
			key: "ui2_doAutoUpdateCheck"
			, value: "1"
			, preLabel: "Automatic update check"
			, inputType: "checkbox"
			, hint: 'If checked, UI2 will automatically check for updates when it loads, no more often than once every 12 hours.<br/><a href="javascript:CheckForUpdates(true)">Click here to check for an update now.</a>'
			, onchange: onui2_doAutoUpdateCheckChanged
			, category: "Misc"
		}
		, {
			key: "ui2_lastIgnoredVersion"
			, value: (typeof ui2_version == "undefined" || ui2_version == null ? "0.12.4" : ui2_version)
		}
		, {
			key: "ui2_enableCanvasDrawing"
			, value: "0"
			, preLabel: "Enable Canvas"
			, inputType: "checkbox"
			, hint: '<p>If checked, video will be drawn to an HTML5 canvas element.</p>'
			+ '<p>Drawing to a canvas has many effects:</p>'
			+ '<p><ul>'
			+ '<li>The canvas is <b>not supported in all browsers.</b></li>'
			+ '<li>The canvas is <b>incompatible with the experimental Frame Rate Boost option.</b></li>'
			+ '<li>CPU usage may <b>increase or decrease</b>.</li>'
			+ '<li>Memory usage may be affected.</li>'
			+ '<li>Image quality may be affected.</li>'
			+ '<li>The canvas enables the use of video filters.</li>'
			+ '<li>The canvas enables the use of H.264 video compression for live view, only in the Google Chrome browser.</li>'
			+ '</ul></p>'
			, onchange: onui2_enableCanvasDrawingChanged
			, category: "HTML5 Canvas"
		}
		//, {
		//	key: "ui2_jpegDiffEnabled"
		//	, value: "0"
		//	, preLabel: "Enable <b>Experimental</b> JpegDiff encoding"
		//	, inputType: "checkbox"
		//	, hint: '<p>Requires the canvas to be enabled.</p>'
		//		+ '<p>JpegDiff encoding is available because it was detected that you are using a compatible version of UI2Service. Here is what JpegDiff encoding means:</p>'
		//		+ '<p><ul>'
		//		+ '<li>Images are compared server-side and only the difference between images is transmitted, saving bandwidth.</li>'
		//		+ '<li>Bandwidth usage is usually reduced by as much as 50%.</li>'
		//		+ '<li>CPU usage is increased on both the server and in the browser.</li>'
		//		+ '<li>Over a low-bandwidth internet connection, frame rate may be improved. But on a fast connection (e.g. a LAN), frame rate is likely to decrease.</li>'
		//		+ '<li>Image quality is reduced.</li>'
		//		+ '<li>Different web browsers use different JPEG decoders which produce slightly different results. My best experience was with Firefox. Colors quickly shifted toward purple in Chrome, and Microsoft Edge performed slowly.</li>'
		//		+ '</ul></p>'
		//	, displayCondition: function () { return serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1; }
		//	, category: "HTML5 Canvas"
		//}
		//, {
		//	key: "ui2_jpegDiffKeyframeIntervalMs"
		//	, value: 4000
		//	, inputType: "number"
		//	, minValue: 0
		//	, maxValue: 600000
		//	, stepSize: 100
		//	, preLabel: "JpegDiff keyframe interval"
		//	, hint: 'Number of milliseconds to wait between requesting keyframes. '
		//		+ 'Due to JPEG decoding differences between UI2Service and the browser, the image will degrade gradually between keyframes in all browsers. '
		//		+ 'Keyframes are larger than other frames, so you save the most bandwidth by requesting them less often. '
		//		+ 'The image quality degradation can be faster in some browsers.'
		//	, displayCondition: function () { return serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1; }
		//	, category: "HTML5 Canvas"
		//}
		//, {
		//	key: "ui2_jpegDiffCompressionQuality"
		//	, value: 80
		//	, inputType: "number"
		//	, minValue: 1
		//	, maxValue: 100
		//	, stepSize: 1
		//	, preLabel: "JpegDiff compression quality"
		//	, hint: 'Accepted range: 1-100. This setting controls the JpegDiff compression specifically. '
		//		+ 'The Low Quality mode available in the Video Streaming tab affects Blue Iris jpeg compression quality, but does not directly affect JpegDiff compression quality.'
		//	, displayCondition: function () { return serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1; }
		//	, category: "HTML5 Canvas"
		//}
		, {
			key: "ui2_streamH264"
			, value: "0"
			, preLabel: "H.264 Live View"
			, inputType: "checkbox"
			, hint: '<p><b>Experimental</b> - ' + (typeof Response != "undefined" && typeof new Response().body == "object"
				? '<span style="color:#00FF00;font-weight:bold">This browser may be compatible.</span>'
				: '<span style="color:#FFFF00;font-weight:bold">This browser is not compatible.</span>')
			+ '</p>'
			+ '<p>In Blue Iris, you must configure encoder profile "Streaming 0" to use Preset: "ultrafast".</p>'
			+ '<p>Streams live video from Blue Iris in H.264 format, typically resulting in higher frame rates and/or higher quality.  If you do not have sufficient bandwidth to sustain the stream, performance may be worse with this option enabled.</p>'
			+ '<p>It is not currently possible to stream recordings to UI2 in this format.</p>'
			+ '<p><b>Enable Canvas</b> must be checked for this option to have any effect.</p>'
			+ '<p><a href="https://www.google.com/chrome/">Requires the Google Chrome browser. <img src="ui2/chrome48.png" /></a></p>'

			, onchange: ToggleH264Streaming
			, category: "HTML5 Canvas"
		}
		, {
			key: "ui2_h264DecodeInWorker"
			, value: "1"
			, preLabel: "H.264 Decode in Worker Thread"
			, inputType: "checkbox"
			, hint: 'If checked, H.264 video will be decoded in a Web Worker, causing the UI to be more responsive.'
			, onchange: onui2_h264DecodeInWorkerChanged
			, category: "HTML5 Canvas"
		}
		, {
			key: "ui2_enableVideoFilter"
			, value: "0"
			, preLabel: "Enable Video Filter"
			, inputType: "checkbox"
			, hint: 'If checked, video frames drawn to the canvas will be passed through a custom filter script first.'
			, onchange: onui2_enableVideoFilterChanged
			, category: "HTML5 Canvas"
		}
		, {
			key: "ui2_preferredVideoFilter"
			, value: ""
			, preLabel: "Custom Video Filter JavaScript:<br/><br/>customVideoFilter = function(rgba) {"
			, postLabel: "<br/>}"
			, inputType: "textarea"
			, hint: '<div style="float:right;margin-right: 30px;">Preview:<br/>'
			+ '<canvas id="video_filter_preview_canvas" style="max-width:320px;max-height:320px;border:1px solid #990000;"></canvas></div>'
			+ '<p>You may enter your own script, or click any of the buttons below to load a predefined filter script:</p>'
			+ '<p><ul>'
			+ '<li><input type="button" value="red1" onclick="loadPredefinedFilter(\'red1\')"/> - Drops the green and blue color channels, leaving only red.</li>'
			+ '<li><input type="button" value="red2" onclick="loadPredefinedFilter(\'red2\')"/> - Replaces red channel with brightest values from all 3 color channels, then drops green and blue channels.</li>'
			+ '<li><input type="button" value="red3" onclick="loadPredefinedFilter(\'red3\')"/> - Replaces red channel with the average of the 3 color channels, then drops green and blue channels.</li>'
			+ '<li><input type="button" value="ghost" onclick="loadPredefinedFilter(\'ghost\')"/> - Sets the alpha channel to the average of the 3 color channels.</li>'
			+ '<li><input type="button" value="invert" onclick="loadPredefinedFilter(\'invert\')"/> - Inverts all pixel values.</li>'
			+ '<li><input type="button" value="invert_red3" onclick="loadPredefinedFilter(\'invert_red3\')"/> - Combines the effects of <b>red3</b> and <b>invert</b> filters.</li>'
			+ '</ul></p>'
			, onchange: onui2_preferredVideoFilterChanged
			, category: "HTML5 Canvas"
		}
		, {
			key: "ui2_cameraLabels_enabled"
			, value: "0"
			, preLabel: "Enable"
			, inputType: "checkbox"
			, hint: 'If checked, camera labels may be shown. Choose what to label with below.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_name"
			, value: "1"
			, preLabel: "Label with Name"
			, inputType: "checkbox"
			, hint: 'The camera full name will be labeled over each camera in group views.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_shortname"
			, value: "0"
			, preLabel: "Label with Short Name"
			, inputType: "checkbox"
			, hint: 'The camera short name will be labeled over each camera in group views.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_cameraColor"
			, value: "1"
			, preLabel: "Use Camera Color"
			, inputType: "checkbox"
			, hint: 'Camera labels will use the colors assigned in Blue Iris.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_fontSize"
			, value: 10
			, preLabel: "Font Size (pt)"
			, inputType: "number"
			, minValue: 1
			, maxValue: 250
			, stepSize: 1
			, hint: '(Default: 10) The point size of the label text.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_minimumFontSize"
			, value: 10
			, preLabel: "Minimum Font Size (pt)"
			, inputType: "number"
			, minValue: 0
			, maxValue: 250
			, stepSize: 1
			, hint: '(Default: 10) If label font scaling is enabled, the label text will never be made smaller than this size. Useful if the outermost zoom level causes the labels to be too small.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_fontScaling"
			, value: "1"
			, preLabel: "Font Scaling"
			, inputType: "checkbox"
			, hint: 'Camera labels will scale with digital zoom level.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_positionTop"
			, value: "1"
			, preLabel: "Position TOP"
			, inputType: "checkbox"
			, hint: 'Checked: Labels appear at the top of cameras.'
			+ '<br/>Unchecked: Labels appear at the bottom of cameras.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_cameraLabels_topOffset"
			, value: 0
			, preLabel: "Y Position Offset"
			, inputType: "number"
			, minValue: -1000
			, maxValue: 1000
			, stepSize: 1
			, hint: '(Default: 0) The vertical position of the labels will be adjusted by this many pixels. This can be used to move labels off the camera images and into the black area between cameras so that none of the view is obstructed.<br/>Hint: If you do not have sufficient black space between cameras, you can add some by increasing the vertical resolution of group images in Blue Iris.'
			, onchange: onui2_cameraLabelsChanged
			, category: "Camera Labels"
		}
		, {
			key: "ui2_serverSelectHint"
			, value: ""
			, preLabel: "none"
			, inputType: "hintonly"
			, hint: '<p style="text-align:center;">UI2 can be used as a client application to connect to any Blue Iris server.</p>'
			+ '<div style="text-align:center;">'
			+ '<div type="button" class="button inlineblock btnBlue2" style="font-size:1.25em;font-style:normal;text-align:center;max-width:275px;" onclick="ShowServerSelectionDialog()">'
			+ 'Click here to open the server selection dialog'
			+ '</div>'
			+ '</div>'
			, category: "Servers"
		}
		, {
			key: "ui2_localServerName"
			, value: "Local Server"
		}
	];
function OverrideDefaultSetting(key, value, OptionsWindow, AlwaysReload, Generation)
{
	for (var i = 0; i < defaultSettings.length; i++)
		if (defaultSettings[i].key == key)
		{
			defaultSettings[i].value = value;
			defaultSettings[i].AlwaysReload = AlwaysReload;
			defaultSettings[i].Generation = Generation;
			if (!OptionsWindow)
				defaultSettings[i].preLabel = null;
			break;
		}
}
function LoadDefaultSettings()
{
	if (settings == null) // This null check allows previously-available local overrides templates to replace the settings object.
		settings = GetLocalStorageWrapper();
	for (var i = 0; i < defaultSettings.length; i++)
	{
		if (settings.getItem(defaultSettings[i].key) == null
			|| defaultSettings[i].AlwaysReload
			|| IsNewGeneration(defaultSettings[i].key, defaultSettings[i].Generation))
			settings.setItem(defaultSettings[i].key, defaultSettings[i].value);
	}
}
function GetLocalStorage()
{
	/// <summary>
	/// Returns the localStorage object, or a dummy localStorage object if the localStorage object is not available.
	/// This method should be used only when the wrapped localStorage object is not desired (e.g. when using settings that are persisted globally, not specific to a Blue Iris server).
	/// </summary>
	try
	{
		if (typeof (Storage) !== "undefined")
			return localStorage; // May throw exception if local storage is disabled by browser settings!
	}
	catch (ex)
	{
	}
	return GetDummyLocalStorage();
}
function IsNewGeneration(key, gen)
{
	if (typeof gen == "undefined" || gen == null)
		return false;

	gen = parseInt(gen);
	var currentGen = settings.getItem("ui2_gen_" + key);
	if (currentGen == null)
		currentGen = 0;
	else
		currentGen = parseInt(currentGen);

	var isNewGen = gen > currentGen;
	if (isNewGen)
		settings.setItem("ui2_gen_" + key, gen);
	return isNewGen;
}
function GetLocalStorageWrapper()
{
	/// <summary>Returns the local storage object or a wrapper suitable for the current Blue Iris server. The result of this should be stored in the settings variable.</summary>
	if (typeof (Storage) !== "undefined")
	{
		if (isUsingRemoteServer)
		{
			if (typeof Object.defineProperty == "function")
				return GetRemoteServerLocalStorage();
			else
			{
				showErrorToast("Your browser is not compatible with Object.defineProperty which is necessary to use remote servers.", 10000);
				SetRemoteServer("");
				return GetLocalStorage();
			}
		}
		else
			return GetLocalStorage();
	}
	return GetDummyLocalStorage()
}
function GetRemoteServerLocalStorage()
{
	if (!ValidateRemoteServerNameSimpleRules(remoteServerName))
	{
		showErrorToast("Unable to validate remote server name. Connecting to local server instead.", 10000);
		SetRemoteServer("");
		return GetLocalStorage();
	}

	var serverNamePrefix = remoteServerName.toLowerCase().replace(/ /g, '_') + "_";

	var myLocalStorage = GetLocalStorage();
	var wrappedStorage = new Object();
	wrappedStorage.getItem = function (key)
	{
		return myLocalStorage[serverNamePrefix + key];
	};
	wrappedStorage.setItem = function (key, value)
	{
		return (myLocalStorage[serverNamePrefix + key] = value);
	};
	for (var i = 0; i < defaultSettings.length; i++)
	{
		var tmp = function (key)
		{
			Object.defineProperty(wrappedStorage, key,
				{
					get: function ()
					{
						return wrappedStorage.getItem(key);
					},
					set: function (value)
					{
						return wrappedStorage.setItem(key, value);
					}
				});
		}(defaultSettings[i].key);
	}
	return wrappedStorage;
}
var localStorageDummy = null;
function GetDummyLocalStorage()
{
	if (localStorageDummy == null)
	{
		var dummy = new Object();
		dummy.getItem = function (key)
		{
			return dummy[key];
		};
		dummy.setItem = function (key, value)
		{
			return (dummy[key] = value);
		};
		localStorageDummy = dummy;
	}
	return localStorageDummy;
}
///////////////////////////////////////////////////////////////
// Interface Loading //////////////////////////////////////////
///////////////////////////////////////////////////////////////
var windowLoaded = false;
var statusLoaded = false;
var cameraListLoaded = false;
var loginLoaded = false;
var loadingFinished = false;

var h264Player;

$(function ()
{
	// Workaround for a Blue Iris redirect bug.
	// UI2 should never receive a "page" url parameter.
	if (UrlParameters.Get("page") != '')
		location.href = location.href.replace(/\?.*/, "");

	// Start loading and initializing everything here.
	if (!TestAvailabilityOfBrowserFeatures())
	{
		SetErrorStatus("#loadingServerStatus");
		SetErrorStatus("#loadingLogin");
		SetErrorStatus("#loadingCameraList");
		showErrorToast("One or more required functionality tests failed. UI2 cannot load.", 60000);
		return;
	}
	HandlePreLoadUrlParameters();

	if (!isUsingRemoteServer && !showServerListAtStartup && location.protocol == "file:")
	{
		showWarningToast("This interface was not loaded through a web server, so there is no default Blue Iris instance. UI2 may function in this configuration, but it is not supported.", 360000);
		showServerListAtStartup = true;
	}

	LoadDefaultSettings();

	UI2_CustomEvent.Invoke("SettingsLoaded");

	if (showServerListAtStartup)
	{
		ShowServerSelectionDialog(function ()
		{
			ReloadWithoutServerList();
		});
		$("#loadingmsgwrapper").remove();
		return;
	}
	//QueryJpegDiffCompatibility();

	h264Player = new H264Player();

	onui2_showSystemNameChanged();
	onui2_showStoplightChanged();
	onui2_enableStoplightButtonChanged();
	onui2_showCpuMemChanged();
	onui2_showProfileChanged();
	onui2_enableProfileButtonsChanged();
	onui2_showScheduleChanged();
	onui2_enableScheduleButtonChanged();
	onui2_showDiskInfoChanged();
	onui2_diskInfoWidthChanged();
	onui2_showQualityButtonChanged();
	onui2_enableCanvasDrawingChanged();
	onui2_preferredVideoFilterChanged(true);
	onui2_enableFrameRateCounterChanged();
	onui2_showSaveSnapshotButtonChanged();
	onui2_showHLSButtonChanged();

	UpdatePtzControlDisplayState();

	if (settings.ui2_autoLoadClipList == "1")
		$("#btn_autoLoadClipList").addClass("selected");

	// This makes it impossible to text-select or drag certain UI elements.
	makeUnselectable($("#layouttop, #layoutleft, #layoutdivider, #layoutbody"));

	// Convert stored login settings from old format to new format shared by other pages
	if (settings.ui2_storedLoginConverted != "1")
	{
		settings.ui2_storedLoginConverted = "1";
		if (settings.ui2_adminrememberme == "1")
		{
			settings.bi_rememberMe = "1";
			settings.bi_username = Base64.encode(SimpleTextGibberize(settings.ui2_adminusername));
			settings.bi_password = Base64.encode(SimpleTextGibberize(settings.ui2_adminpassword));
		}
		else
		{
			settings.bi_rememberMe = "0";
			settings.bi_username = "";
			settings.bi_password = "";
		}

		settings.ui2_adminrememberme = "";
		settings.ui2_adminusername = "";
		settings.ui2_adminpassword = "";

		// Convert all saved servers
		var serverList = GetServerList();
		for (var i = 0; i < serverList.length; i++)
		{
			var server = serverList[i];
			server.user = Base64.encode(SimpleTextGibberize(server.user));
			server.pass = Base64.encode(SimpleTextGibberize(server.pass));
		}
		SaveServerList();
	}
	// Use stored login
	if (settings.bi_rememberMe == "1")
	{
		SessionLogin(Base64.decode(settings.bi_username), Base64.decode(settings.bi_password));
		$("#cbRememberMe").prop("checked", true);
	}
	else
		SessionLogin(Base64.decode(remoteServerUser), Base64.decode(remoteServerPass));

	LoadContextMenus();
	EnableDraggableDivider();
	EnablePTZButtons();
	EnableProfileButtons();
	EnableStoplightButton();
	InitDropdownListLogic();
	InitPlaybackLogic();
	InitQualityButtonLogic();
	EnableHotkeys();
	InitDatePickerLogic();
	SetupH264Toggler();

	HandleMidLoadUrlParameters();

	$(window).resize(resized);
	resized();

	setTimeout(function ()
	{
		CheckForUpdates_Automatic();
	}, 1000);
});
$(window).load(function ()
{
	windowLoaded = true;
	SetLoadedStatus("#loadingWebContent");
});
function FinishLoadingIfConditionsMet()
{
	if (loadingFinished)
		return;
	if (windowLoaded && cameraListLoaded && statusLoaded && loginLoaded)
	{
		loadingFinished = true;
		$("#loadingmsgwrapper").remove();

		resized();
		StartRefresh();
		UI2_CustomEvent.Invoke("FinishedLoading");
	}
}
///////////////////////////////////////////////////////////////
// Browser Feature Detection //////////////////////////////////
///////////////////////////////////////////////////////////////
var passedTest_LocalStorage = false;
var passedTest_Cookies = false;
function TestAvailabilityOfBrowserFeatures()
{
	// Test Local Storage
	var message = TestAvailabilityOfLocalStorage();
	if (message == null)
		passedTest_LocalStorage = true;
	else
		showErrorToast(message, 60000);
	var message = TestAvailabilityOfCookies();
	if (message == null)
		passedTest_Cookies = true;
	else
		showErrorToast(message, 60000);

	// Return true only if all REQUIRED tests passed.
	return passedTest_Cookies;
}
function TestAvailabilityOfLocalStorage()
{
	try
	{
		if (typeof (Storage) !== "undefined")
		{
			if (localStorage) // May throw exception if local storage is disabled by browser settings!
				return null;
			else
				return "Local storage is disabled in your browser's privacy settings. UI2 will be unable to persist your settings.";
		}
		else
		{
			return "Local storage is not available in your browser. UI2 will be unable to persist your settings.";
		}
	}
	catch (ex)
	{
		return "Local storage is disabled in your browser's privacy settings. UI2 will be unable to persist your settings.";
	}
}
function TestAvailabilityOfCookies()
{
	if (navigator.cookieEnabled)
		return null;
	else
		return "Cookies are disabled in your browser's privacy settings. Cookies are required by UI2 for session management.";
}
///////////////////////////////////////////////////////////////
// URL Parameters /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function HandlePreLoadUrlParameters()
{
	// Parameter "group"
	var group = UrlParameters.Get("group");
	if (group != '')
		OverrideDefaultSetting("ui2_defaultCameraGroupId", group, true, true, 0);

	// Parameter "server"
	var serverName = UrlParameters.Get("server");
	if (serverName != "")
	{
		if (ValidateRemoteServerNameSimpleRules(serverName))
			SetRemoteServer(serverName);
		else
			showErrorToast("Unable to validate remote server name.", 10000);
	}

	// Parameter "serverlist"
	showServerListAtStartup = UrlParameters.Get("serverlist") == "1";
}
function HandleMidLoadUrlParameters()
{
	// Parameter "cam"
	var cam = UrlParameters.Get("cam");
	if (cam != '')
	{
		UI2_CustomEvent.AddListener("FinishedLoading", function ()
		{
			var camData = GetCameraWithId(cam);
			if (camData != null)
				ImgClick_Camera(camData);
		});
	}

	// Parameter "fullscreen"
	var fullscreen = UrlParameters.Get("fullscreen");
	if (fullscreen == '1')
	{
		$("#layoutleft").css("width", "0px");
	}
	else if (fullscreen != '')
	{
		$("#layoutleft").css("width", layoutLeftOriginalWidth + "px");
	}
}
///////////////////////////////////////////////////////////////
// UI Resize //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function resized()
{
	var windowW = $(window).width();
	var windowH = $(window).height();

	var layouttop = $("#layouttop");
	var layoutleft = $("#layoutleft");
	var layoutdivider = $("#layoutdivider");
	var layoutbody = $("#layoutbody");

	var topV = layouttop.is(":visible");
	var leftW = layoutleft.outerWidth(true);

	// The layoutleft element must not be too large.
	if (leftW > windowW - 50)
	{
		leftW = windowW - 50;
		layoutleft.css('width', leftW + "px");
	}

	settings.ui2_leftBarSize = leftW;

	// Size the main layout panels
	if (leftW <= 0 && topV)
	{
		if (settings.ui2_hideTopBar == "1")
		{
			layouttop.hide();
			topV = false;
		}
		goLive();
	}
	else if (leftW > 0 && !topV)
	{
		layouttop.show();
		topV = true;
	}

	if (!topV && settings.ui2_hideTopBar != "1")
	{
		layouttop.show();
		topV = true;
	}

	var topH = topV ? layouttop.outerHeight(true) : 0;

	layoutleft.css("top", topH);
	layoutleft.css("height", windowH - topH + "px");

	layoutdivider.css("top", topH);
	layoutdivider.css("left", leftW + "px");
	layoutdivider.css("height", windowH - topH + "px");

	layoutbody.css("top", topH);
	layoutbody.css("left", leftW + "px");
	layoutbody.css("width", windowW - leftW + "px");
	layoutbody.css("height", windowH - topH + "px");

	PositionPlaybackControls();

	var clipstools = $("#clipstools");

	var totalButtonsWidth = 0;
	clipstools.children().each(function (idx, ele)
	{
		var eleId = ele.getAttribute("id");
		if (eleId != "clipsCameraName" && eleId != "clipstools_clearboth" && eleId != "btnGoLive")
		{
			totalButtonsWidth += $(ele).outerWidth(true);
		}
	});
	var clipsCameraName = $("#clipsCameraName");
	var clipsCameraNameWidth = clipstools.width() - totalButtonsWidth - (clipsCameraName.outerWidth(true) - clipsCameraName.width()) - 2; // -2 because otherwise sometimes the line wraps to two lines when using DPI scaling or zoom.
	$("#clipsCameraName").css("width", clipsCameraNameWidth + "px");

	$(".dropdown_list").each(function (idx, ele)
	{
		var $ele = $(ele);
		$ele.css("max-height", ((windowH - 40) - $ele.offset().top) + "px");
	});

	ImgResized(false);
	HandleClipListZoom();
}
///////////////////////////////////////////////////////////////
// Clip List Zoom /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastSetClipZoom = 1;
function HandleClipListZoom()
{
	var layoutleft = $("#layoutleft");
	var layoutbody = $("#layoutbody");
	var clipsheading = $("#clipsheading");
	var clipstools = $("#clipstools");
	var clipsbody = $("#clipsbody");

	var newClipZoom = layoutleft.outerWidth(true) / layoutLeftOriginalWidth;
	if (settings.ui2_clipListZoom != "1")
		newClipZoom = 1;
	newClipZoom *= parseFloat(settings.ui2_clipListZoomMultiplier);
	if (newClipZoom < 0.1)
		newClipZoom = 0.1;
	if (lastSetClipZoom != newClipZoom)
	{
		lastSetClipZoom = newClipZoom;
		clipsbody.css("zoom", newClipZoom);
	}

	clipsbody.css("height", ((layoutbody.outerHeight(true) - clipsheading.outerHeight(true) - clipstools.outerHeight(true)) / newClipZoom) + "px");

	appearDisappearCheck();
}
///////////////////////////////////////////////////////////////
// Playback Controls Layout ///////////////////////////////////
///////////////////////////////////////////////////////////////
var lastOpacity = 2;
var requiredTopBarWidth = 475;
function PositionPlaybackControls()
{
	if (currentlyLoadingImage.isLive)
		return;
	var playback_controls = $("#playback_controls");
	var pcH = playback_controls.outerHeight(true);
	var windowH = $(window).height();
	var windowW = $(window).width();
	var playback_controls_width;
	var topH = $("#layoutdivider").offset().top;
	var playback_controls_top;
	var mayAppearTop = settings.ui2_clipPlaybackControlsMayAppearOnTop == "1";
	var mayAppearBottom = settings.ui2_clipPlaybackControlsMayAppearOnBottom == "1";
	var mayAppearTopBar = settings.ui2_clipPlaybackControlsMayAppearOnTopBar == "1";
	var availableTopBarWidth = mayAppearTopBar ? CalculateAvailableTopBarWidthForPlaybackControls() : 0;
	var shouldAppearOnTopBar = availableTopBarWidth > requiredTopBarWidth;
	if ((!mayAppearTop && !mayAppearBottom && !shouldAppearOnTopBar) || currentlyLoadingImage.isLive)
	{
		lastOpacity = 2;
		playback_controls.css("z-index", -1);
		return;
	}
	if (shouldAppearOnTopBar)
	{
		playback_controls_top = 0;
		playback_controls_width = availableTopBarWidth - 10;
		if (playback_controls.parent().attr("id") != "layouttop")
			playback_controls.appendTo("#layouttop");
		playback_controls.css("display", "inline-block");
	}
	else
	{
		if (!mayAppearTop
			|| (mayAppearBottom
				&& mouseY > ((windowH - topH) / 2) + topH))
			playback_controls_top = windowH - topH - pcH - 10;
		else
			playback_controls_top = 10;
		playback_controls_width = windowW - $("#layoutleft").outerWidth(true) - 50;
		if (playback_controls.parent().attr("id") != "layoutbody")
			playback_controls.appendTo("#layoutbody");
		playback_controls.css("display", "block");
	}
	playback_controls.css("top", playback_controls_top + "px");
	playback_controls.css("width", playback_controls_width + "px");

	SetSeekbarPositionByPlaybackTime(clipPlaybackPosition);

	// Determine opacity of playback controls.
	var opacity = 0;
	var layoutbody = $("#layoutbody");
	var bodyOffset = layoutbody.offset();
	if (isDraggingSeekbar || settings.ui2_clipPlaybackControlsDisappearWhenCursorIsFar != "1" || shouldAppearOnTopBar)
		opacity = 1;
	else
	//if (mouseX >= bodyOffset.left
	//&& mouseY >= bodyOffset.top
	//&& mouseX < bodyOffset.left + layoutbody.outerWidth(true)
	//&& mouseY < bodyOffset.top + layoutbody.outerHeight(true))
	{
		var pcY = playback_controls.offset().top + (pcH / 2);
		var distance = Math.abs(mouseY - pcY);
		if (distance > 50)
		{
			var fadeDistance = Math.max(layoutbody.outerHeight(true) * 0.37, 200);
			opacity = 1.0 - ((distance - 50) / fadeDistance);
		}
		else
			opacity = 1;
	}
	var minOpacity = parseInt(settings.ui2_clipPlaybackControlsMinimumOpacity) / 100.0;
	if (opacity < minOpacity)
		opacity = minOpacity;
	if (lastOpacity != opacity)
	{
		lastOpacity = opacity;
		if (opacity <= 0.009)
		{
			opacity = 1;
			playback_controls.css("z-index", -1);
		}
		else
			playback_controls.css("z-index", 1);
		playback_controls.css("opacity", opacity);
	}
}
function CalculateAvailableTopBarWidthForPlaybackControls()
{
	var layouttop = $("#layouttop");
	var totalWidth = layouttop.width();
	var usedWidth = 10; // The Log Out button has 10 uncounted pixels to the right.
	layouttop.children().each(function (idx, ele)
	{
		var $ele = $(ele);
		if ($ele.attr("id") != "playback_controls" && $ele.is(":visible"))
			usedWidth += $ele.outerWidth(true);
	});
	return totalWidth - usedWidth;
}
///////////////////////////////////////////////////////////////
// Status Update //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastStatusResponse = null;
var statusUpdateTimeout = null;
var currentProfileNames = null;
var currentlySelectedSchedule = "";
var globalScheduleEnabled = false;
var lastStatusUpdateFailed = false;
function LoadStatus(profileNum, stoplightState, schedule)
{
	if (statusUpdateTimeout != null)
		clearTimeout(statusUpdateTimeout);

	var args = { cmd: "status" };
	if (typeof profileNum != "undefined" && profileNum != null && settings.ui2_enableProfileButtons == "1")
	{
		if (isAdministratorSession)
			args.profile = parseInt(profileNum);
		else
		{
			openLoginDialog();
		}
	}
	if (typeof stoplightState != "undefined" && stoplightState != null && settings.ui2_enableStoplightButton == "1")
	{
		if (isAdministratorSession)
			args.signal = parseInt(stoplightState);
		else
		{
			openLoginDialog();
		}
	}
	if (typeof schedule != "undefined" && schedule != null && settings.ui2_enableScheduleButton == "1")
	{
		if (isAdministratorSession)
			args.schedule = schedule;
		else
		{
			openLoginDialog();
		}
	}
	ExecJSON(args, function (response)
	{
		if (response && typeof response.result != "undefined" && response.result == "fail")
		{
			showWarningToast('UI2 has detected that your Blue Iris session may have expired.  This page will reload momentarily.', 10000);
			setTimeout(function ()
			{
				location.reload();
			}, 5000);
			return;
		}

		if (lastStatusUpdateFailed)
			KickstartMjpegStream();
		lastStatusUpdateFailed = false;

		HandleChangesInStatus(lastStatusResponse, response);
		lastStatusResponse = response;
		if (response && response.data)
		{
			$("#stoplight img").hide();
			if (response.data.signal == "0")
				$("#stoplightred").show();
			else if (response.data.signal == "1")
				$("#stoplightgreen").show();
			else if (response.data.signal == "2")
				$("#stoplightyellow").show();

			$("#cpuusage").text(response.data.cpu + "%");
			if (response.data.cpu < 50)
				$("#cpuusage").css("color", "#00CC00");
			else if (response.data.cpu < 70)
				$("#cpuusage").css("color", "#99CC00");
			else if (response.data.cpu < 80)
				$("#cpuusage").css("color", "#CCCC00");
			else if (response.data.cpu < 87)
				$("#cpuusage").css("color", "#CCAA00");
			else if (response.data.cpu < 95)
				$("#cpuusage").css("color", "#CC9900");
			else
				$("#cpuusage").css("color", "#CC0000");
			$("#memusage").text(response.data.mem);
			$("#current_schedule").attr("title", response.data.schedule);
			$("#diskinfo").text(response.data.clips);
			UpdateProfileStatus();
			UpdateScheduleStatus();
		}
		statusLoaded = true;
		SetLoadedStatus("#loadingServerStatus");

		var nextStatusUpdateDelay = settings.ui2_timeBetweenStatusUpdates;
		if (typeof args.schedule != "undefined")
			nextStatusUpdateDelay = 1000; // We just updated the schedule. Refresh again soon in case of profile change.
		if (statusUpdateTimeout != null)
			clearTimeout(statusUpdateTimeout);
		statusUpdateTimeout = setTimeout(function ()
		{
			LoadStatus();
		}, nextStatusUpdateDelay);
	}, function ()
		{
			lastStatusUpdateFailed = true;
			statusUpdateTimeout = setTimeout(function ()
			{
				LoadStatus();
			}, Math.max(settings.ui2_timeBetweenStatusUpdates, 1000));
		});
}
function HandleChangesInStatus(oldStatus, newStatus)
{
	if (oldStatus && oldStatus.data && newStatus && newStatus.data)
	{
		if (oldStatus.data.profile != newStatus.data.profile)
			ProfileChanged();
	}
}
var profileChangedTimeout = null;
function ProfileChanged()
{
	// Refresh the clips and camera lists.
	showInfoToast("Your profile has changed.<br/>Reinitializing shortly...", 5000);
	if (profileChangedTimeout != null)
		clearTimeout(profileChangedTimeout);
	profileChangedTimeout = setTimeout(function () { firstCameraListLoaded = false; LoadCameraList(); KickstartMjpegStream(); }, 5000);
}
function UpdateProfileStatus()
{
	if (lastStatusResponse != null)
	{
		var selectedProfile = lastStatusResponse.data.profile;
		var schedule = lastStatusResponse.data.schedule;
		if (schedule == "")
			schedule = "N/A";
		var lock = lastStatusResponse.data.lock;
		$(".profilebtn").removeClass("selected");
		$('.profilebtn[profilenum="' + selectedProfile + '"]').addClass("selected");
		if (lock == 0)
		{
			$("#schedule_lock_button").removeClass("hold");
			$("#schedule_lock_button").removeClass("temp");
			$("#schedule_lock_overlay").attr("src", "ui2/refresh44x94.png");
			$("#schedule_lock_button").attr("title", 'Schedule "' + schedule + '" is active. Click to disable automatic scheduling.');
		}
		else if (lock == 1)
		{
			$("#schedule_lock_button").addClass("hold");
			$("#schedule_lock_button").removeClass("temp");
			$("#schedule_lock_overlay").attr("src", "ui2/hold44x94.png");
			$("#schedule_lock_button").attr("title", 'Schedule "' + schedule + '" is currently disabled. Click to re-enable.');
		}
		else if (lock == 2)
		{
			$("#schedule_lock_button").removeClass("hold");
			$("#schedule_lock_button").addClass("temp");
			$("#schedule_lock_overlay").attr("src", "ui2/clock44x94.png");
			$("#schedule_lock_button").attr("title", 'Schedule "' + schedule + '" is temporarily overridden. Click to resume schedule, or wait some hours and it should return to normal.');
		}
		else
			showErrorToast("unexpected <b>lock</b> value from Blue Iris status");
	}
	if (currentProfileNames)
		for (var i = 0; i < 8; i++)
		{
			var tooltipText = currentProfileNames[i];
			if (i == 0 && tooltipText == "Inactive")
				tooltipText = "Inactive profile";
			$('.profilebtn[profilenum="' + i + '"]').attr("title", tooltipText);
		}
}
function UpdateScheduleStatus()
{
	if (lastStatusResponse == null)
		return;
	currentlySelectedSchedule = lastStatusResponse.data.schedule;
	globalScheduleEnabled = currentlySelectedSchedule != "";
	if (!globalScheduleEnabled)
		currentlySelectedSchedule = "N/A";
	$("#selectedSchedule").text(currentlySelectedSchedule);
}
function EnableProfileButtons()
{
	$("#schedule_lock_button").click(function ()
	{
		LoadStatus(-1);
	});
	$(".profilebtn").click(function ()
	{
		LoadStatus($(this).attr("profilenum"));
	});
}
function EnableStoplightButton()
{
	$("#stoplight").click(function ()
	{
		if (lastStatusResponse == null)
			return;
		var newSignal = 0;
		if (lastStatusResponse.data.signal != 0)
			newSignal = 0;
		else
			newSignal = 2;
		LoadStatus(null, newSignal);
	});
}
///////////////////////////////////////////////////////////////
// Load Clip List /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var clipListCache = new Object();
var lastLoadedClipIds = new Array();
var lastClickedClip = null;
//var clipListTimeout = null;
var isLoadingAClipList = false;
var failedClipListLoads = 0;
var currentlySelectedClipGroupId = null;
var DesiredClipDateStart = 0;
var DesiredClipDateEnd = 0;
var QueuedClipListLoad = null;
var HeightOfOneClipTilePx = 86;
var TotalUniqueClipsLoaded = 0;
function LoadClips(listName, cameraId, myDateStart, myDateEnd, isContinuationOfPreviousLoad)
{
	if (!isContinuationOfPreviousLoad)
	{
		if (typeof cameraId == "undefined" || cameraId == null)
			cameraId = currentlyLoadingImage.id;
		else if (cameraId == "preserve_current_clipgroup")
			cameraId = currentlySelectedClipGroupId;
		SelectClipsCamera(cameraId);

		if (isLoadingAClipList)
		{
			QueuedClipListLoad = function ()
			{
				LoadClips(listName, cameraId, myDateStart, myDateEnd);
			};
			return;
		}
		if (typeof (listName) == "undefined" || listName == null)
			listName = settings.ui2_preferredClipList;

		if (listName == "cliplist")
		{
			$("#clipsheading_label").text("Clips");
			$("#btn_clips").addClass("selected");
			$("#btn_alerts").removeClass("selected");
		}
		else
		{
			listName = "alertlist";
			$("#clipsheading_label").text("Alerts");
			$("#btn_alerts").addClass("selected");
			$("#btn_clips").removeClass("selected");
		}

		settings.ui2_preferredClipList = listName;

		AppearDisappearCheckEnabled = false;
		lastClickedClip = null;
		TotalUniqueClipsLoaded = 0;
		lastLoadedClipIds = new Array();
		$("#clipsbody").empty();
		$("#clipsbody").html('<img src="ui2/ajax-loader-clips.gif" alt="Loading ..." style="margin: 20px" />'
			+ '<br/><br/><span id="clipListDateRange"></span>');
		// We will reset the clipListCache only if we get a valid clip list response, so that currently playing clips and such can still function.
		unregisterAllOnAppearDisappear();
		StopImageQueue();
		emptyAsyncImageQueue();

		isLoadingAClipList = true;
	}

	if (typeof myDateStart == "undefined" || myDateStart == null)
		myDateStart = DesiredClipDateStart;
	if (typeof myDateEnd == "undefined" || myDateEnd == null)
		myDateEnd = DesiredClipDateEnd;

	var allowContinuation = false;
	var args = { cmd: listName, camera: cameraId };
	if (myDateStart != 0 && myDateEnd != 0)
	{
		allowContinuation = true;
		args.startdate = myDateStart;
		args.enddate = myDateEnd;
	}

	ExecJSON(args, function (response)
	{
		var clipsbody = $("#clipsbody");
		failedClipListLoads = 0;
		//		console.log("START");
		//		var start = new Date().getTime();
		if (typeof (response.data) != "undefined")
		{
			clipListCache = new Object();
			lastLoadedClipIds = new Array(response.data.length);
			for (var lastLoadedClipIds_idx = 0, i = 0; i < response.data.length; i++)
			{
				// clip.camera : "shortname"
				// clip.path : "@0000123.bvr"
				// clip.offset : 0
				// clip.date : 12345
				// clip.color : 8151097
				// clip.flags : 128
				// clip.msec : 6261
				// clip.filesize : "10sec (3.09M)"
				// clip.filetype : "bvr H264 New"

				var clip = response.data[i];
				var clipData = new Object();
				clipData.roughLength = CleanUpFileSize(clip.filesize);
				clipData.isSnapshot = clipData.roughLength == "Snapshot";
				if (clipData.isSnapshot && settings.ui2_clipsShowSnapshots != "1")
					continue;
				clipData.camera = clip.camera;
				clipData.path = clip.path;
				clipData.flags = clip.flags;
				clipData.date = new Date(clip.date * 1000);
				clipData.colorHex = BlueIrisColorToCssColor(clip.color);
				clipData.nameColorHex = GetReadableTextColorHexForBackgroundColorHex(clipData.colorHex);
				clipData.fileSize = GetFileSize(clip.filesize);
				if (clipData.isSnapshot)
					clipData.msec = parseInt(1000 * settings.ui2_snapshotPlaybackTimeSeconds);
				else if (typeof clip.msec != "undefined" && listName == "cliplist")
					clipData.msec = clip.msec;
				else
					clipData.msec = GetClipLengthMs(clipData.roughLength);

				if (clip.jpeg)
				{
					clipData.clipId = clip.jpeg.replace(/@/g, "");
					clipData.thumbPath = clip.jpeg;
				}
				else
				{
					clipData.clipId = clip.path.replace(/@/g, "").replace(/\..*/g, "");
					clipData.thumbPath = clip.path;
				}

				lastLoadedClipIds[lastLoadedClipIds_idx++] = clipData.clipId;

				if (!clipListCache[clip.camera])
					clipListCache[clip.camera] = new Object();
				if (!clipListCache[clip.camera][clip.path]) // Only register if not already registered
				{
					registerOnAppearDisappear(clipData, ClipOnAppear, ClipOnDisappear);
					TotalUniqueClipsLoaded++;
				}

				clipListCache[clip.camera][clip.path] = clipData;
			}
			if (!currentlyLoadingImage.isLive && GetCachedClip(currentlyLoadingImage.id, currentlyLoadingImage.path) == null)
				goLive();
			// Trim the lastLoadedClipIds array, because we may have not loaded snapshots.
			lastLoadedClipIds.length = lastLoadedClipIds_idx;

			if (QueuedClipListLoad != null)
			{
				isLoadingAClipList = false;
				QueuedClipListLoad();
				QueuedClipListLoad = null;
				return;
			}

			if (allowContinuation && response.data.length >= 1000)
			{
				myDateEnd = response.data[response.data.length - 1].date;
				$("#clipListDateRange").html("&nbsp;Remaining to load:<br/>&nbsp;&nbsp;&nbsp;" + parseInt((myDateEnd - myDateStart) / 86400) + " days");
				return LoadClips(listName, cameraId, myDateStart, myDateEnd, true);
			}
		}
		// var end = new Date().getTime();
		//		console.log("FINISH");
		//		console.log(end - start);
		// showInfoToast("Clip list loaded in <br/>" + (end - start) / 1000.0);

		isLoadingAClipList = false;
		clipsbody.empty();

		// Force clip list to be the correct height before clip tiles load.
		clipsbody.append('<div style="height:' + (HeightOfOneClipTilePx * TotalUniqueClipsLoaded) + 'px;width:0px;"></div>');

		RestartImageQueue();
		AppearDisappearCheckEnabled = true;
		appearDisappearCheck();

		//		if (settings.clipListAutoRefresh)
		//		{
		//			if (clipListTimeout)
		//				clearTimeout(clipListTimeout);
		//			clipListTimeout = setTimeout(function ()
		//			{
		//				LoadClips();
		//			}, settings.timeBetweenClipListUpdates);
		//		}
	}, function (jqXHR, textStatus, errorThrown)
		{
			var tryAgain = ++failedClipListLoads < 5
			showErrorToast("Failed to load " + (listName == "cliplist" ? "clip list" : "alert list") + ".<br/>Will " + (tryAgain ? "" : "NOT ") + "try again.<br/>" + textStatus + "<br/>" + errorThrown, 5000);

			try
			{
				// Blue Iris 4.1.3.0 builds an invalid alertlist.  This detects the error and automatically switches to cliplist.
				if (listName == "alertlist" && textStatus && textStatus.indexOf("parser") != -1)
					listName = "cliplist";
			}
			catch (ex)
			{
			}

			if (tryAgain)
			{
				setTimeout(function ()
				{
					LoadClips(listName, cameraId, myDateStart, myDateEnd, isContinuationOfPreviousLoad);
				}, 1000);
			}
			else
			{
				isLoadingAClipList = false;
				failedClipListLoads = 0;
			}
		});
}
function GetCachedClip(cameraId, clipPath)
{
	var camClips = clipListCache[cameraId];
	if (camClips)
		return camClips[clipPath];
	return null;
}
function ThumbOnAppear(ele)
{
	var path = remoteBaseURL + "thumbs/" + ele.getAttribute("path") + GetRemoteSessionArg("?");
	if (ele.getAttribute('src') != path)
		enqueueAsyncImage(ele, path);
}
function ThumbOnDisappear(ele)
{
	dequeueAsyncImage(ele);
}
function ClipOnAppear(clipData)
{
	var $clip = $("#c" + clipData.clipId);
	if ($clip.length == 0)
	{
		var dateStr;
		if (settings.ui2_clipListDateUseLocale == "1")
			dateStr = clipData.date.toLocaleString();
		else
			dateStr = GetDateStr(clipData.date);
		$("#clipsbody").append('<div id="c' + clipData.clipId + '" class="cliptile" style="top:' + clipData.y + 'px" msec="' + clipData.msec + '"><div class="cliptilehelper inlineblock"></div>'
			+ '<div class="clipimghelper inlineblock"><img id="t' + clipData.clipId + '" src="ui2/LoadingSmall.png" /></div>' // /thumbs/' + clip.path + '
			+ '<div class="clipdesc inlineblock"><span style="background-color: #' + clipData.colorHex + ';color: #' + clipData.nameColorHex + ';" class="clip_cam_shortid">' + clipData.camera + '</span><br/><span class="timestamp">' + dateStr + '</span><br/>' + clipData.roughLength + '</div>'
			// + '<div id="extra' + clipId + '" class="clipextrathumbs inlineblock"></div>'
			+ '</div>');
		var img = document.getElementById("t" + clipData.clipId);

		$clip = $("#c" + clipData.clipId);
		$clip.click(ClipClicked);
		$clip.hover(ClipTileHoverOver, ClipTileHoverOut);
		$clip.attr("path", clipData.path);
		$clip.attr("size", clipData.fileSize);
		$clip.attr("camid", clipData.camera);
		$clip.attr("date", clipData.date.getTime());

		registerClipListContextMenu($clip);

		img.setAttribute("path", clipData.thumbPath);

		if ((clipData.flags & 2) > 0) // Clip is flagged
			ShowClipFlag($clip);
	}
	ThumbOnAppear($("#t" + clipData.clipId).get(0));
}
function ClipOnDisappear(clipData)
{
	ThumbOnDisappear($("#t" + clipData.clipId).get(0));
	//$("#c" + clipData.clipId).remove(); // Removing the clip while a thumbnail loading "thread" might be working on it causes the thread to fail.
}
function ClipClicked()
{
	if (lastClickedClip)
		$(lastClickedClip).removeClass("selected");
	lastClickedClip = this;

	$(this).addClass("selected");

	LoadClipWithPath(this.getAttribute("path"), this.getAttribute("camid"), parseInt(this.getAttribute("msec")));

	StopClipThumbPlayback($(this));
}
function goLive()
{
	if (currentlyLoadingImage.isLive)
		return;
	if (lastClickedClip)
	{
		$(lastClickedClip).removeClass("selected");
		lastClickedClip = null;
	}
	currentlyLoadingCamera = GetGroupCamera(currentlySelectedHomeGroupId);
	UpdateSelectedLiveCameraFields();
}
function CleanUpFileSize(fileSize)
{
	var indexSpace = fileSize.indexOf(" ");
	if (indexSpace > 0)
		fileSize = fileSize.substring(0, indexSpace);
	return fileSize;
}
function GetFileSize(fileSize)
{
	var parentheticals = fileSize.match(/\(.*?\)$/);
	if (parentheticals && parentheticals.length > 0)
		return parentheticals[0].substr(1, parentheticals[0].length - 2);
	return "";
}
function GetClipLengthMs(str)
{
	var hours = 0;
	var minutes = 0;
	var seconds = 10;

	var match = new RegExp("(\\d+)h").exec(str);
	if (match)
		hours = parseInt(match[1]);

	match = new RegExp("(\\d+)m").exec(str);
	if (match)
		minutes = parseInt(match[1]);

	match = new RegExp("(\\d+)sec").exec(str);
	if (match)
		seconds = parseInt(match[1]);

	return (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
}
function ShowClipFlag($clip)
{
	$clip.addClass("clipflagged");
}
function HideClipFlag($clip)
{
	$clip.removeClass("clipflagged");
}
function ClipTileHoverOver(event)
{
	StartClipThumbPlayback($(event.currentTarget));
}
function ClipTileHoverOut(event)
{
	StopClipThumbPlayback($(event.currentTarget));
}
///////////////////////////////////////////////////////////////
// Clip Thumbnail Video Preview ///////////////////////////////
///////////////////////////////////////////////////////////////
var lastThumbLoadTime = 0;
var thumbVideoTimeout = null;
var clipPreviewNumFrames = 8;
var clipPreviewNumLoopsAllowed = 3;
var clipThumbPlaybackActive = false;
var clipPreviewStartTimeout = null;
var nextClipPreviewToStart = null;
function StartClipThumbPlayback($clip)
{
	if (hasSeenTouchEvent || settings.ui2_clipPreviewEnabled != "1" || parseInt($clip.attr('msec')) < 500)
		return;
	if (clipPreviewStartTimeout != null)
	{
		// A preview recently started. Schedule this to start later.
		nextClipPreviewToStart = $clip.attr("id");
		return;
	}
	clipPreviewStartTimeout = setTimeout(function ()
	{
		clipPreviewStartTimeout = null;
		if (nextClipPreviewToStart != null)
		{
			var $nextclip = $("#" + nextClipPreviewToStart);
			if ($nextclip.length > 0)
				StartClipThumbPlayback($nextclip);
		}
	}, 500);
	nextClipPreviewToStart = null;
	lastThumbLoadTime = 0;
	var $thumb = $("#t" + $clip.attr("id").substr(1));
	$thumb.load(ThumbVideoLoadHandler);
	$thumb.error(ThumbVideoErrorHandler);
	LoadNextThumbImage($thumb, 0);
}
function StopClipThumbPlayback($clip)
{
	nextClipPreviewToStart = null;
	if (hasSeenTouchEvent && !clipThumbPlaybackActive)
		return;
	clipThumbPlaybackActive = false;
	if (thumbVideoTimeout != null)
	{
		clearTimeout(thumbVideoTimeout);
		thumbVideoTimeout = null;
	}
	lastThumbLoadTime = 0;
	var $thumb = $("#t" + $clip.attr("id").substr(1));
	$thumb.unbind("load", ThumbVideoLoadHandler);
	$thumb.unbind("error", ThumbVideoLoadHandler);
	ThumbOnAppear($thumb.get(0));
}
function ThumbVideoLoadHandler()
{
	var $thumb = $(this);
	if (this.complete && typeof this.naturalWidth != "undefined" && this.naturalWidth != 0 && this.naturalHeight != 0)
	{
		var aspectRatio = this.naturalWidth / this.naturalHeight;
		$thumb.css("width", aspectRatio < 1 ? "auto" : "80px");
		$thumb.css("height", aspectRatio < 1 ? "80px" : "auto");
	}
	LoadNextThumbImage($thumb, parseInt($thumb.attr("framenum")));
}
function ThumbVideoErrorHandler()
{
	var $thumb = $(this);
	LoadNextThumbImage($thumb, parseInt($thumb.attr("framenum")));
}
function LoadNextThumbImage($thumb, framenum)
{
	if (isLoggingOut)
		return;
	clipThumbPlaybackActive = true;
	var $clip = $("#c" + $thumb.attr("id").substr(1));
	var timeNow = new Date().getTime();
	var timeWaited = timeNow - lastThumbLoadTime;
	// If the clip has looped 3 times already, we should stop the preview unless we believe it is loading images efficiently from cache.
	if (framenum >= clipPreviewNumFrames * clipPreviewNumLoopsAllowed && timeWaited > 40)
	{
		StopClipThumbPlayback($clip);
		return;
	}
	$thumb.attr("framenum", (framenum + 1));
	var timeValue = ((framenum % clipPreviewNumFrames) / clipPreviewNumFrames) * parseInt($clip.attr('msec'));
	var qualityArg = "";
	var widthToRequest = $thumb.parent().width() * settings.ui2_dpiScalingFactor * lastSetClipZoom;
	if (settings.ui2_currentImageQuality == 0)
	{
		qualityArg = "&q=" + settings.ui2_lowQualityJpegQualityValue;
		widthToRequest = parseInt(widthToRequest * settings.ui2_lowQualityJpegSizeMultiplier);
	}
	try
	{
		var cam = GetCameraWithId($clip.attr("camid"));
		var aspectRatio = cam == null ? 1.77 : cam.width / cam.height;
		if (aspectRatio < 1)
			widthToRequest = widthToRequest * aspectRatio;
	}
	catch (ex) { showErrorToast(ex); }
	var clipThumbUrl = remoteBaseURL + "file/clips/" + $thumb.attr("path") + '?time=' + timeValue + "&w=" + widthToRequest + qualityArg + GetRemoteSessionArg("&");
	var timeToWait = 200 - timeWaited;
	if (timeToWait < 0)
		timeToWait = 0;
	else if (timeToWait > 1000)
		timeToWait = 1000;
	if (timeToWait == 0)
	{
		lastThumbLoadTime = timeNow;
		$thumb.attr("src", clipThumbUrl);
	}
	else
		thumbVideoTimeout = setTimeout(function ()
		{
			lastThumbLoadTime = new Date().getTime();
			$thumb.attr("src", clipThumbUrl);
		}, timeToWait);
}
///////////////////////////////////////////////////////////////
// Clip Calendar //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var datePickerModal = null;
var suppressDatePickerCallbacks = false;
function InitDatePickerLogic()
{
	$('#datePickerDate1').Zebra_DatePicker({
		always_visible: $('#datePicker1Container'),
		onClear: function (ele) { DatePickerClear(ele, 1); },
		onSelect: function (dateCustom, dateYMD, noonDateObj, ele) { DatePickerSelect(dateCustom, dateYMD, noonDateObj, ele, 1); }
	});
	$('#datePickerDate2').Zebra_DatePicker({
		always_visible: $('#datePicker2Container'),
		onClear: function (ele) { DatePickerClear(ele, 2); },
		onSelect: function (dateCustom, dateYMD, noonDateObj, ele) { DatePickerSelect(dateCustom, dateYMD, noonDateObj, ele, 2); }
	});
	$("#lblClipDate").click(function ()
	{
		suppressDatePickerCallbacks = true;
		$('#datePickerDate1').data('Zebra_DatePicker').clear_date();
		$('#datePickerDate2').data('Zebra_DatePicker').clear_date();
		suppressDatePickerCallbacks = false;
		DesiredClipDateStart = DesiredClipDateEnd = 0;
		$("#lblClipDate").text("");
		$('#btn_clipCalendar').removeClass("selected");
		LoadClips(null, 'preserve_current_clipgroup');
	});
}
function DatePickerClear(ele, datePickerNum)
{
	if (suppressDatePickerCallbacks)
		return;
	suppressDatePickerCallbacks = true;
	if (datePickerNum == 1)
		$('#datePickerDate2').data('Zebra_DatePicker').clear_date();
	else
		$('#datePickerDate1').data('Zebra_DatePicker').clear_date();
	suppressDatePickerCallbacks = false;
	DesiredClipDateStart = DesiredClipDateEnd = 0;
	$("#lblClipDate").text("");
	$('#btn_clipCalendar').removeClass("selected");
	LoadClips(null, 'preserve_current_clipgroup');
}
function DatePickerSelect(dateCustom, dateYMD, noonDateObj, ele, datePickerNum)
{
	if (suppressDatePickerCallbacks)
		return;
	var startOfDay = new Date(noonDateObj.getFullYear(), noonDateObj.getMonth(), noonDateObj.getDate());
	SeparateClipDateLabelIntoTwo();
	if (datePickerNum == 1)
	{
		DesiredClipDateStart = startOfDay.getTime() / 1000;
		$("#lblClipDateSub1").text(dateYMD);
		if (DesiredClipDateStart >= DesiredClipDateEnd)
		{
			DesiredClipDateEnd = DesiredClipDateStart + 86400; // (86400 seconds in a day)
			$("#lblClipDateSub2").text(dateYMD);
			suppressDatePickerCallbacks = true;
			$('#datePickerDate2').data('Zebra_DatePicker').set_date(dateYMD);
			suppressDatePickerCallbacks = false;
		}
	}
	else
	{
		DesiredClipDateEnd = (startOfDay.getTime() / 1000) + 86400; // (86400 seconds in a day)
		$("#lblClipDateSub2").text(dateYMD);
		if (DesiredClipDateStart >= DesiredClipDateEnd || DesiredClipDateStart == 0)
		{
			DesiredClipDateStart = DesiredClipDateEnd - 86400; // (86400 seconds in a day)
			$("#lblClipDateSub1").text(dateYMD);
			suppressDatePickerCallbacks = true;
			$('#datePickerDate1').data('Zebra_DatePicker').set_date(dateYMD);
			suppressDatePickerCallbacks = false;
		}
	}
	$('#btn_clipCalendar').addClass("selected");
	LoadClips(null, 'preserve_current_clipgroup');
}
function SeparateClipDateLabelIntoTwo()
{
	$("#lblClipDate").addClass("lblClipDateTwoLines");
	if ($("#lblClipDateSub1").length == 0)
		$("#lblClipDate").html('<span id="lblClipDateSub1"></span><br/><span id="lblClipDateSub2"></span>');
}
function ClipCalendarClicked()
{
	SeparateClipDateLabelIntoTwo();
	datePickerModal = $("#datePickerDialog").modal({ sizeToFitContent: true });
}
///////////////////////////////////////////////////////////////
// Load Camera List ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastCameraListResponse = null;
var currentlyLoadingCamera = null;
var currentlyLoadedCamera = null;
var firstCameraListLoaded = false;
var currentlySelectedHomeGroupId = null;
var hasOnlyOneCamera = false;
var cameraListUpdateTimeout = null;
function LoadCameraList(successCallbackFunc)
{
	if (cameraListUpdateTimeout != null)
		clearTimeout(cameraListUpdateTimeout);
	ExecJSON({ cmd: "camlist" }, function (response)
	{
		if (typeof (response.data) == "undefined" || response.data.length == 0)
		{
			if (firstCameraListLoaded)
				showErrorToast("Camera list is empty!");
			else
			{
				lastCameraListResponse = response;
				SetErrorStatus("#loadingCameraList", "Camera list is empty! Try reloading the page.");
			}
			return;
		}
		lastCameraListResponse = response;
		var containsGroup = false;
		for (var i = 0; i < lastCameraListResponse.data.length; i++)
		{
			if (lastCameraListResponse.data[i].group)
			{
				containsGroup = true;
				break;
			}
		}
		hasOnlyOneCamera = !containsGroup;
		if (!containsGroup)
		{
			// No group was found, so we will add one.
			var newDataArray = new Array();
			newDataArray.push(GetFakeIndexCameraData());
			for (var i = 0; i < lastCameraListResponse.data.length; i++)
				newDataArray.push(lastCameraListResponse.data[i]);
			lastCameraListResponse.data = newDataArray;
		}
		if (!firstCameraListLoaded || GetCameraWithId(currentlyLoadingCamera.optionValue) == null)
		{
			if (GetGroupCamera(settings.ui2_defaultCameraGroupId) == null)
				SelectCameraGroup(lastCameraListResponse.data[0].optionValue);
			else
				SelectCameraGroup(settings.ui2_defaultCameraGroupId);
		}
		if (!firstCameraListLoaded)
		{
			cameraListLoaded = true;
			SetLoadedStatus("#loadingCameraList");

			firstCameraListLoaded = true;
			LoadClips();
		}
		try
		{
			if (successCallbackFunc)
				successCallbackFunc(lastCameraListResponse);
		}
		catch (ex)
		{
			showErrorToast(ex, 30000);
		}

		if (cameraListUpdateTimeout != null)
			clearTimeout(cameraListUpdateTimeout);
		cameraListUpdateTimeout = setTimeout(function ()
		{
			LoadCameraList();
		}, 5000);
	}, function ()
		{
			setTimeout(function ()
			{
				LoadCameraList(successCallbackFunc);
			}, 1000);
		});
}
function GetFakeIndexCameraData()
{
	var camName;
	var camWidth;
	var camHeight;
	var ptz;

	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		var cameraObj = lastCameraListResponse.data[i];
		if (!CameraIsGroupOrCycle(cameraObj) && cameraObj.isEnabled)
		{
			camName = cameraObj.optionValue;
			camWidth = cameraObj.width;
			camHeight = cameraObj.height;
			ptz = cameraObj.ptz;
			break;
		}
	}

	return {
		optionDisplay: "+All cameras"
		, optionValue: camName
		, isMotion: false
		, isTriggered: false
		, xsize: 1
		, ysize: 1
		, width: camWidth
		, height: camHeight
		, ptz: ptz
		, group: []
		, rects: []
	};
}
///////////////////////////////////////////////////////////////
// Camera List Dialog /////////////////////////////////////////
///////////////////////////////////////////////////////////////
var modal_cameralistdialog = null;
var timeBetweenCameraListThumbUpdates = 1000 * 60 * 60 * 24; // 1 day
function ShowCameraList()
{
	CloseCameraListDialog();
	modal_cameralistdialog = $('<div id="cameralistdialog"><div class="cameralisttitle">' + htmlEncode($("#system_name").text()) + ' Camera List <img id="camlist_refresh_btn" src="ui2/refresh48.png" class="btn24 spin2s" alt="Refresh"></div>'
		+ '<div id="cameralistcontent" class="cameralistcontent"></div></div>'
	).modal({ removeElementOnClose: true });
	$("#camlist_refresh_btn").click(function ()
	{
		ShowCameraList();
	});
	LoadCameraList(function ()
	{
		$("#camlist_refresh_btn").removeClass("spin2s");
		var $cameralistcontent = $("#cameralistcontent");
		if ($cameralistcontent.length == 0)
			return;
		if (typeof (lastCameraListResponse.data) == "undefined" || lastCameraListResponse.data.length == 0)
		{
			$cameralistcontent.html("The camera list is empty! Please try reloading the page.");
			return;
		}
		// Add camera boxes
		for (var i = 0; i < lastCameraListResponse.data.length; i++)
		{
			var cam = lastCameraListResponse.data[i];
			if (!CameraIsGroupOrCycle(cam))
			{
				$cameralistcontent.append('<div class="camlist_item">'
					+ GetCameraListLabel(cam)
					+ '</div>');
			}
		}
		// Finish up
		$cameralistcontent.append('<div></div>'
			+ '<div class="camlist_item_center"><input type="button" class="simpleTextButton btnTransparent" onclick="UpdateCameraThumbnails(true)" value="force refresh thumbnails" title="Thumbnails otherwise update only once per day" />'
			+ ' <input type="button" class="simpleTextButton btnTransparent" onclick="ShowRawCameraList()" value="view raw data" />'
			+ '</div>');
		UpdateCameraThumbnails();
	});
}
function CloseCameraListDialog()
{
	if (modal_cameralistdialog != null)
		modal_cameralistdialog.close();
	$("#cameralistdialog").remove();
}
function ShowRawCameraList()
{
	$('<div class="cameralistcontent"></div>').append(ArrayToHtmlTable(lastCameraListResponse.data)).modal({ removeElementOnClose: true });
}
function GetCameraListLabel(cam)
{
	var labelText = cam.optionDisplay + " (" + cam.optionValue + ")";
	var colorHex = BlueIrisColorToCssColor(cam.color);
	var nameColorHex = GetReadableTextColorHexForBackgroundColorHex(colorHex);

	var floatingBadges = '';
	if (cam.isPaused)
		floatingBadges += '<img class="icon16" src="ui2/pause_shadow32.png" alt="P" title="paused" />';
	if (cam.isRecording)
		floatingBadges += '<img class="icon16" src="ui2/record_shadow32.png" alt="R" title="recording" />';
	if (cam.isAlerting)
		floatingBadges += '<img class="icon16" src="ui2/lightning_shadow32.png" alt="A" title="alerting" />';
	if (cam.isEnabled && (!cam.isOnline || cam.isNoSignal))
		floatingBadges += '<img class="icon16" src="ui2/alert_shadow32.png" alt="O" title="offline / no signal" />';
	if (!cam.isEnabled)
		floatingBadges += '<img class="icon16" src="ui2/reset_shadow32.png" alt="D" title="disabled" />';
	if (floatingBadges != '')
		floatingBadges = '<div style="float: right;">' + floatingBadges + '</div>';

	return '<div class="camlist_thumbbox" onclick="camListThumbClick(\'' + cam.optionValue + '\')" style="background-color: #' + colorHex + ';">'
		+ '<div class="camlist_thumb">'
		+ '<div class="camlist_thumb_aligner"></div>'
		+ '<div class="camlist_thumb_helper"><img src="" alt="" class="camlist_thumb_img" camid="' + cam.optionValue + '" isEnabled="' + (cam.isEnabled ? '1' : '0') + '" aspectratio="' + (cam.width / cam.height) + '" />'
		+ '</div></div>'
		+ '<div class="camlist_label" style="background-color: #' + colorHex + '; color: #' + nameColorHex + ';">' + floatingBadges + htmlEncode(labelText) + '</div>'
		+ '</div>';
}
function camListThumbClick(camId)
{
	ShowCameraProperties(camId);
}
function UpdateCameraThumbnails(overrideImgDate)
{
	$("#cameralistcontent").find("img.camlist_thumb_img").each(function (idx, ele)
	{
		var $ele = $(ele);
		var camId = $ele.attr("camId");
		var settingsKey = "ui2_camlistthumb_" + camId;
		var imgData = settings.getItem(settingsKey);
		if (imgData != null && imgData.length > 0)
		{
			$ele.attr("src", imgData);
			$ele.css("display", "block");
			$ele.parent().parent().find(".camlist_thumb_aligner").css("height", "120px");
		}
		if ($ele.attr('isEnabled') == '1')
		{
			var imgDate = settings.getItem(settingsKey + "_date");
			if (!imgDate)
				imgDate = 0;
			if (imgDate + timeBetweenCameraListThumbUpdates < new Date().getTime() || overrideImgDate)
			{
				var sizeArg = "&w=160";
				if (parseFloat($ele.attr("aspectratio")) < (160 / 120))
					sizeArg = "&h=120";
				var tmpImgSrc = remoteBaseURL + "image/" + camId + '?time=' + new Date().getTime() + sizeArg + "&q=50" + GetRemoteSessionArg("&", true);
				PersistImageFromUrl(settingsKey, tmpImgSrc, function (imgAsDataURL)
				{
					settings.setItem(settingsKey + "_date", new Date().getTime())
					$ele.attr("src", imgAsDataURL);
					$ele.css("display", "block");
					$ele.parent().parent().find(".camlist_thumb_aligner").css("height", "120px");
				}
					, function (message)
					{
						settings.setItem(settingsKey + "_date", new Date().getTime())
					});
			}
		}
	});
}
///////////////////////////////////////////////////////////////
// PTZ Actions ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var unsafePtzActionNeedsStopped = false;
var currentPtz = "0";
var currentPtzCamId = "";
var unsafePtzActionQueued = null;
var unsafePtzActionInProgress = false;

window.onbeforeunload = function ()
{
	if (unsafePtzActionNeedsStopped)
	{
		unsafePtzActionNeedsStopped = false;
		unsafePtzActionQueued = null;
		if (!unsafePtzActionInProgress)
			PTZ_unsafe_sync_guarantee(currentPtzCamId, currentPtz, 1);
	}
	return;
}

function SendOrQueuePtzCommand(ptzCamId, ptzCmd, isStopCommand)
{
	ptzCmd = parseInt(ptzCmd);
	if (settings.ui2_safeptz == "1" && !isStopCommand)
	{
		unsafePtzActionNeedsStopped = false;
		unsafePtzActionQueued = null;
		PTZ_async_noguarantee(ptzCamId, ptzCmd);
	}
	else
	{
		// UNSAFE PTZ
		if (isStopCommand)
		{
			if (unsafePtzActionNeedsStopped)
			{
				if (currentPtzCamId != null && currentPtz != null)
				{
					if (unsafePtzActionInProgress)
					{
						unsafePtzActionQueued = function ()
						{
							PTZ_unsafe_async_guarantee(currentPtzCamId, currentPtz, 1);
						};
					}
					else
						PTZ_unsafe_async_guarantee(currentPtzCamId, currentPtz, 1);
				}
				unsafePtzActionNeedsStopped = false;
			}
		}
		else
		{
			if (!unsafePtzActionNeedsStopped && !unsafePtzActionInProgress && unsafePtzActionQueued == null)
			{
				// All-clear for new start command
				currentPtzCamId = ptzCamId;
				currentPtz = ptzCmd;
				unsafePtzActionNeedsStopped = true;
				PTZ_unsafe_async_guarantee(currentPtzCamId, currentPtz, 1);
			}
		}
	}
}
function EnablePTZButtons()
{
	$(".ptzbtn").each(function (idx, ele)
	{
		$(ele).mousedown(function (e)
		{
			SendOrQueuePtzCommand(currentlyLoadingImage.id, ele.getAttribute("ptzcmd"), false);
			e.preventDefault();
		});
		$(ele).mouseleave(function (e)
		{
			SendOrQueuePtzCommand(null, null, true);
		});
	});
	$(document).mouseup(function (e)
	{
		SendOrQueuePtzCommand(null, null, true);
	});

	$(".ptzpreset").each(function (idx, ele)
	{
		var elePresetNum = $(ele).attr("presetnum");
		$(ele).html('<span id="presetSpan' + elePresetNum + '">' + elePresetNum + '</span><img id="presetThumb' + elePresetNum + '" src="about:blank" alt="' + elePresetNum + '" title="' + elePresetNum + '" class="presetThumb" style="display:none" />');
		$(ele).click(function ()
		{
			var ptzCmd = 100 + parseInt(ele.getAttribute("presetnum"));
			PTZ_async_noguarantee(currentlyLoadingImage.id, ptzCmd);
		});
		$(ele).longpress(function ()
		{
			var presetNum = parseInt(ele.getAttribute("presetnum"));
			if (confirm("You are about to assign preset " + presetNum))
			{
				PTZ_set_preset(currentlyLoadingImage.id, presetNum);
			}
		});
		$(ele).mouseenter(function (e)
		{
			var elePresetNum = $(ele).attr("presetnum");
			var imgData = settings.getItem("ui2_preset_" + currentlyLoadingImage.id + "_" + elePresetNum);
			if (imgData != null && imgData.length > 0)
			{
				var thumb = $("#presetBigThumb");
				if (thumb.length == 0)
				{
					$("body").append('<img id="presetBigThumb" alt="" />');
					thumb = $("#presetBigThumb");
				}
				thumb.attr("src", imgData);

				var thisOffset = $(this).offset();
				thumb.css("left", thisOffset.left + "px");
				thumb.css("top", (thisOffset.top + ($(this).height() * 3)) + "px");
				thumb.show();
			}
		});
		$(ele).mouseleave(function (e)
		{
			var thumb = $("#presetBigThumb");
			thumb.hide();
		});
	});
}
function LoadPtzPresetThumbs()
{
	$(".ptzpreset").each(function (idx, ele)
	{
		var elePresetNum = $(ele).attr("presetnum");
		$(ele).html('<span id="presetSpan' + elePresetNum + '">' + elePresetNum + '</span><img id="presetThumb' + elePresetNum + '" src="about:blank" alt="' + elePresetNum + '" title="Preset ' + elePresetNum + '" class="presetThumb" style="display:none" />');
		var imgData = settings.getItem("ui2_preset_" + currentlyLoadingImage.id + "_" + elePresetNum);
		if (imgData != null && imgData.length > 0)
		{
			$("#presetThumb" + elePresetNum).attr("src", imgData);
			$("#presetThumb" + elePresetNum).show();
			$("#presetSpan" + elePresetNum).hide();
		}
	});
}
function PTZ_set_preset(cameraId, presetNumber)
{
	var args = { cmd: "ptz", camera: cameraId, button: (100 + presetNumber), description: "Preset " + presetNumber };
	ExecJSON(args, function (response)
	{
		if (response && typeof response.result != "undefined" && response.result == "success")
		{
			showSuccessToast("Preset " + presetNumber + " set successfully.");
			UpdatePresetImage(cameraId, presetNumber);
		}
	}, function ()
		{
			showErrorToast("Unable to save preset");
		});
}

function PTZ_async_noguarantee(cameraId, ptzCmd, updown)
{
	var args = { cmd: "ptz", camera: cameraId, button: parseInt(ptzCmd) };
	if (updown == "1")
		args.updown = 1;
	else if (updown == "2")
		args.button = 64;
	ExecJSON(args, function (response)
	{
	}, function ()
		{
		});
}
function PTZ_unsafe_async_guarantee(cameraId, ptzCmd, updown)
{
	unsafePtzActionInProgress = true;
	var args = { cmd: "ptz", camera: cameraId, button: ptzCmd };
	if (updown == "1")
		args.updown = 1;
	else if (updown == "2")
		args.button = 64;
	ExecJSON(args, function (response)
	{
		unsafePtzActionInProgress = false;
		if (unsafePtzActionQueued != null)
		{
			unsafePtzActionQueued();
			unsafePtzActionQueued = null;
		}
	}, function ()
		{
			setTimeout(function ()
			{
				PTZ_unsafe_async_guarantee(cameraId, ptzCmd, updown);
			}, 100);
		});
}
function PTZ_unsafe_sync_guarantee(cameraId, ptzCmd, updown)
{
	unsafePtzActionInProgress = true;
	var args = { cmd: "ptz", camera: cameraId, button: ptzCmd };
	if (updown == "1")
		args.updown = 1;
	else if (updown == "2")
		args.button = 64;
	ExecJSON(args, function (response)
	{
		unsafePtzActionInProgress = false;
		if (unsafePtzActionQueued != null)
		{
			unsafePtzActionQueued();
			unsafePtzActionQueued = null;
		}
	}, function ()
		{
			PTZ_unsafe_sync_guarantee(cameraId, ptzCmd, updown);
		}, true);
}
function UpdatePresetImage(cameraId, presetNumber)
{
	if (isLoggingOut)
		return;
	if (cameraId != currentlyLoadingImage.id)
		return;

	var sizeArg = "&w=160";
	if (currentlyLoadingImage.aspectratio < 1)
		sizeArg = "&h=160";
	var tmpImgSrc = remoteBaseURL + "image/" + currentlyLoadingImage.path + '?time=' + new Date().getTime() + sizeArg + "&q=50" + GetRemoteSessionArg("&", true);
	PersistImageFromUrl("ui2_preset_" + cameraId + "_" + presetNumber, tmpImgSrc
		, function (imgAsDataURL)
		{
			if (cameraId == currentlyLoadingImage.id)
			{
				$("#presetThumb" + presetNumber).attr("src", imgAsDataURL);
				$("#presetThumb" + presetNumber).show();
				$("#presetSpan" + presetNumber).hide();
			}
		}, function (message)
		{
			showErrorToast("Failed to save preset image. " + message, 10000);
		});
}
///////////////////////////////////////////////////////////////
// Get / Set Camera Config ////////////////////////////////////
///////////////////////////////////////////////////////////////
function GetCameraConfig(camId, successCallbackFunc, failCallbackFunc)
{
	ExecJSON({ cmd: "camconfig", camera: camId }, function (response)
	{
		if (typeof response.result == "undefined")
		{
			showErrorToast("Unexpected response when getting camera configuration from server.");
			return;
		}
		if (response.result == "fail")
		{
			openLoginDialog();
			return;
		}
		if (successCallbackFunc)
			successCallbackFunc(response, camId);
	}, function ()
		{
			if (failCallbackFunc)
				failCallbackFunc(camId);
		});
}
function SetCameraConfig(camId, key, value, successCallbackFunc, failCallbackFunc)
{
	var args = { cmd: "camconfig", camera: camId };
	if (key == "manrec")
		args.manrec = value;
	else if (key == "reset")
		args.reset = value;
	else if (key == "enable")
		args.enable = value;
	else if (key == "pause")
		args.pause = value;
	else if (key == "motion")
		args.motion = value;
	else if (key == "schedule")
		args.schedule = value;
	else if (key == "ptzcycle")
		args.ptzcycle = value;
	else if (key == "ptzevents")
		args.ptzevents = value;
	else if (key == "alerts")
		args.alerts = value;
	else if (key == "record")
		args.record = value;
	else if (key == "push")
		args.push = value;
	else if (key == "output")
		args.output = value;
	else
	{
		showErrorToast('Unknown camera configuration key: ' + htmlEncode(key), 3000);
		return;
	}
	ExecJSON(args, function (response)
	{
		if (typeof response.result == "undefined")
		{
			showErrorToast("Unexpected response when setting camera configuration on server.");
			return;
		}
		if (response.result == "fail")
		{
			openLoginDialog();
			return;
		}
		if (successCallbackFunc)
			successCallbackFunc(response, camId, key, value);
	}, function ()
		{
			if (failCallbackFunc)
				failCallbackFunc(camId, key, value);
			else
				showWarningToast("Failed to set camera configuration!");
		});
}
///////////////////////////////////////////////////////////////
// Camera Properties Dialog ///////////////////////////////////
///////////////////////////////////////////////////////////////
var modal_cameraPropDialog = null;
var modal_cameraPropRawDialog = null;
function ShowCameraProperties(camId)
{
	CloseCameraProperties();

	var camName = GetCameraName(camId);
	modal_cameraPropDialog = $('<div id="campropdialog"><div class="campropheader">'
		+ '<div class="camproptitle">' + htmlEncode(camName)
		+ ' Properties <img id="camprop_refresh_btn" src="ui2/refresh48.png" class="btn24 spin2s" alt="Refresh"></div>'
		+ '</div>'
		+ '<div id="campropcontent"><div style="text-align: center"><img src="ui2/ajax-loader-clips.gif" alt="Loading..." /></div></div>'
		+ '</div>'
	).modal({
		removeElementOnClose: true
		, maxWidth: 500
		, onClosing: function ()
		{
			if ($("#cameralistcontent").length != 0)
				ShowCameraList();
		}
	});
	$("#camprop_refresh_btn").click(function ()
	{
		ShowCameraProperties(camId);
	});
	GetCameraConfig(camId, function (response)
	{
		$("#camprop_refresh_btn").removeClass("spin2s");
		var $camprop = $("#campropcontent");
		$camprop.empty();
		if ($camprop.length == 0)
			return;
		/* Example Response
		{
		  "result": "success",
		  "session": "...",
		  "data": {
			"pause": 0,
			"push": false,
			"motion": true,
			"schedule": false,
			"ptzcycle": false,
			"ptzevents": false,
			"alerts": 0,
			"output": false,
			"setmotion": {
			  "audio_trigger": false,
			  "audio_sense": 10000,
			  "usemask": true,
			  "sense": 8650,
			  "contrast": 67,
			  "showmotion": 0,
			  "shadows": true,
			  "luminance": false,
			  "objects": true,
			  "maketime": 16,
			  "breaktime": 70
			},
			"record": 2
		  }
		}
		*/
		try
		{
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("Override Global Schedule") + GetOnOffButtonMarkup("schedule|" + camId, response.data.schedule, "camPropOnOffBtnClick") + '</div>');
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("Motion sensor") + GetOnOffButtonMarkup("motion|" + camId, response.data.motion, "camPropOnOffBtnClick") + '</div>');
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("PTZ preset cycle") + GetOnOffButtonMarkup("ptzcycle|" + camId, response.data.ptzcycle, "camPropOnOffBtnClick") + '</div>');
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("PTZ event schedule") + GetOnOffButtonMarkup("ptzevents|" + camId, response.data.ptzevents, "camPropOnOffBtnClick") + '</div>');
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("Mobile App Push") + GetOnOffButtonMarkup("push|" + camId, response.data.push, "camPropOnOffBtnClick") + '</div>');
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("Record:")
				+ '<select mysetting="record|' + camId + '" onchange="camPropSelectChange(this)">'
				+ GetHtmlOptionElementMarkup("-1", "Only manually", response.data.record.toString())
				+ GetHtmlOptionElementMarkup("0", "Every X.X minutes", response.data.record.toString())
				+ GetHtmlOptionElementMarkup("1", "Continuously", response.data.record.toString())
				+ GetHtmlOptionElementMarkup("2", "When triggered", response.data.record.toString())
				+ GetHtmlOptionElementMarkup("3", "Triggered + periodically", response.data.record.toString())
				+ '</select>'
				+ '</div>');
			$camprop.append('<div class="camprop_item">' + GetCameraPropertyLabel("Alerts:")
				+ '<select mysetting="alerts|' + camId + '" onchange="camPropSelectChange(this)">'
				+ GetHtmlOptionElementMarkup("-1", "Never", response.data.alerts.toString())
				+ GetHtmlOptionElementMarkup("0", "This camera is triggered", response.data.alerts.toString())
				+ GetHtmlOptionElementMarkup("1", "Any camera in group is triggered", response.data.alerts.toString())
				+ GetHtmlOptionElementMarkup("2", "Any camera is triggered", response.data.alerts.toString())
				+ '</select>'
				+ '</div>');
			$camprop.append('<div class="camprop_item">Manual Recording Options:</div>');
			$camprop.append('<div class="camprop_item camprop_item_center">'
				+ GetCameraPropertyButtonMarkup("Trigger", "trigger", "largeBtnYellow", camId)
				+ GetCameraPropertyButtonMarkup("Snapshot", "snapshot", "largeBtnBlue", camId)
				+ GetCameraPropertyButtonMarkup("Toggle Recording", "manrec", "largeBtnRed", camId)
				+ '</div>');
			$camprop.append('<div class="camprop_item">Camera Management:</div>');
			$camprop.append('<div class="camprop_item camprop_item_center">'
				+ GetCameraPropertyButtonMarkup("Pause", "pause", "largeBtnDisabled", camId)
				+ GetCameraPropertyButtonMarkup("Reset", "reset", "largeBtnBlue", camId)
				+ GetCameraPropertyButtonMarkup("Disable", "disable", "largeBtnRed", camId)
				+ '</div>');
			var cam = GetCameraWithId(camId);
			if (cam)
				SetCameraPropertyEnableButtonState(cam.isEnabled);
			UpdateCamListAndUpdateUi(camId);
		}
		catch (ex)
		{
			showErrorToast(ex);
		}
		$camprop.append('<div class="camprop_item camprop_item_center"><input type="button" class="simpleTextButton btnTransparent" onclick="OpenRawCameraProperties(&quot;' + camId + '&quot;)" value="view raw data" /></div>');
	}, function ()
		{
			CloseCameraProperties();
		});
}
function GetCameraPropertyLabel(text)
{
	return '<div class="camprop_label" title="' + text + '">' + text + '</div>';
}
function GetHtmlOptionElementMarkup(value, name, selectedValue)
{
	return '<option value="' + value + '"' + (selectedValue == value ? ' selected="selected"' : '') + '>' + name + '</option>';
}
function GetCameraPropertyButtonMarkup(text, buttonId, colorClass, camId)
{
	return '<input type="button" id="camprop_button_' + buttonId + '" class="largeTextButton ' + colorClass + '" onclick="camPropButtonClick(&quot;' + camId + '&quot;, &quot;' + buttonId + '&quot;)" value="' + text + '" />';
}
function CloseCameraProperties()
{
	if (modal_cameraPropDialog != null)
		modal_cameraPropDialog.close();
	$("#campropdialog").remove();
}
function camPropOnOffBtnClick(mysetting, buttonStateIsOn)
{
	var parts = mysetting.split('|');
	var settingName = parts[0];
	var camId = parts[1];
	//showInfoToast("Pretending to set " + settingName + " = " + $btn.hasClass("on") + " for camera " + camId);
	SetCameraConfig(camId, settingName, buttonStateIsOn);
}
function camPropSelectChange(select)
{
	var mysetting = $(select).attr("mysetting");
	var parts = mysetting.split('|');
	var settingName = parts[0];
	var camId = parts[1];
	selectedValue = parseInt(select.value);
	//showInfoToast("Pretending to set " + settingName + " = " + selectedValue + " for camera " + camId);
	SetCameraConfig(camId, settingName, selectedValue);
}
function camPropButtonClick(camId, button)
{
	switch (button)
	{
		case "trigger":
			TriggerCamera(camId);
			break;
		case "snapshot":
			SaveSnapshotInBlueIris(camId);
			break;
		case "manrec":
			ManualRecordCamera(camId, $("#camprop_button_manrec").attr("start"), SetCameraPropertyManualRecordButtonState);
			break;
		case "reset":
			ResetCamera(camId);
			break;
		case "disable":
			SetCameraConfig(camId, "enable", $("#camprop_button_disable").attr("enabled") != "1"
				, function ()
				{
					SetCameraPropertyEnableButtonState($("#camprop_button_disable").attr("enabled") != "1");
				});
			break;
		case "pause":
		default:
			showErrorToast(button + " not implemented in this UI2 version");
			break;
	}
}
function UpdateCamListAndUpdateUi(camId)
{
	LoadCameraList(function (camList)
	{
		for (var i = 0; i < camList.data.length; i++)
		{
			if (camList.data[i].optionValue == camId)
			{
				SetCameraPropertyManualRecordButtonState(camList.data[i].isRecording);
				SetCameraPropertyEnableButtonState(camList.data[i].isEnabled);
				break;
			}
		}
	});
}
function SetCameraPropertyManualRecordButtonState(is_recording)
{
	if (is_recording)
	{
		$("#camprop_button_manrec").val("Stop Recording");
		$("#camprop_button_manrec").attr("start", "0");
	}
	else
	{
		$("#camprop_button_manrec").val("Start Recording");
		$("#camprop_button_manrec").attr("start", "1");
	}
}
function SetCameraPropertyEnableButtonState(is_enabled)
{
	if (is_enabled)
	{
		$("#camprop_button_disable").val("Disable");
		$("#camprop_button_disable").attr("enabled", "1");
		$("#camprop_button_disable").removeClass("largeBtnGreen");
		$("#camprop_button_disable").addClass("largeBtnRed");
	}
	else
	{
		$("#camprop_button_disable").val("Enable");
		$("#camprop_button_disable").attr("enabled", "0");
		$("#camprop_button_disable").removeClass("largeBtnRed");
		$("#camprop_button_disable").addClass("largeBtnGreen");
	}
}
function OpenRawCameraProperties(camId)
{
	var camName = GetCameraName(camId);
	GetCameraConfig(camId, function (response)
	{
		modal_cameraPropDialog = $('<div id="campropdialog"><div class="campropheader">'
			+ '<div>' + htmlEncode(camName)
			+ ' Raw Properties</div>'
			+ '</div>'
			+ '<div class="selectable" style="word-wrap: break-word; border:1px solid #000000; background-color: #FFFFFF; color: #000000; margin: 10px; padding: 10px;">'
			+ JSON.stringify(response)
			+ '</div>'
			+ '</div>'
		).modal({ removeElementOnClose: true, maxWidth: 600, maxHeight: 500 });
	}, function ()
		{
			showWarningToast("Unable to load camera properties for " + camName);
		});
}
///////////////////////////////////////////////////////////////
// Reset Camera ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ResetCamera(camId)
{
	var camName = GetCameraName(camId);
	SetCameraConfig(camId, "reset", true, function (response)
	{
		showSuccessToast("Camera " + camName + " is restarting");
		if (settings.ui2_useMjpeg == "1")
			KickstartMjpegStream();
	}, function ()
		{
			showErrorToast("Camera " + camName + " could not be reset");
		});
}
///////////////////////////////////////////////////////////////
// Manual Recording Start / Stop //////////////////////////////
///////////////////////////////////////////////////////////////
function ManualRecordCamera(camId, start, successCallback)
{
	if (start == "1")
		start = true;
	else if (start == "0")
		start = false;
	else
	{
		var camList = lastCameraListResponse;
		for (var i = 0; i < camList.data.length; i++)
		{
			if (camList.data[i].optionValue == camId)
			{
				start = !camList.data[i].isRecording;
				break;
			}
		}
	}
	LoadCameraList(function (camList)
	{
		SetCameraConfig(camId, "manrec", start, function ()
		{
			setTimeout(function ()
			{
				LoadCameraList(function (camList)
				{
					for (var i = 0; i < camList.data.length; i++)
					{
						if (camList.data[i].optionValue == camId)
						{
							showInfoToast(camList.data[i].optionDisplay + " " + (camList.data[i].isRecording ? '<span style="font-weight: bold;color:Red; background-color: #000000;">IS RECORDING</span>' : '<span style="font-weight: bold;color:Green; background-color: #000000;">IS NOT RECORDING</span>'));
							if (successCallback)
								successCallback(camList.data[i].isRecording);
							break;
						}
					}
				});
			}, 250);
		}, function ()
			{
				showErrorToast("Failed to toggle manual recording for " + camId);
			});
	});
}
function LoadDynamicManualRecordingButtonState(camId)
{
	$("#manRecBtnLabel").text("Toggle Recording");
	$("#manRecBtnLabel").removeAttr("start");
	LoadCameraList(function (camList)
	{
		for (var i = 0; i < camList.data.length; i++)
		{
			if (camList.data[i].optionValue == camId)
			{
				if (camList.data[i].isRecording)
				{
					$("#manRecBtnLabel").text("Stop Recording");
					$("#manRecBtnLabel").attr("start", "0");
					return true;
				}
				else
				{
					$("#manRecBtnLabel").text("Start Recording");
					$("#manRecBtnLabel").attr("start", "1");
					return false;
				}
				break;
			}
		}
	});
}
///////////////////////////////////////////////////////////////
// Trigger Camera /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function TriggerCamera(camId)
{
	ExecJSON({ cmd: "trigger", camera: camId }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			openLoginDialog();
			return;
		}
		if (response.result == "success")
			showSuccessToast("Triggered camera " + camId);
		else
			showErrorToast("Failed to trigger camera " + camId);
	}, function ()
		{
			showErrorToast("Failed to contact Blue Iris server to trigger camera " + camId);
		});
}
///////////////////////////////////////////////////////////////
// Change Clip Flags State ////////////////////////////////////
///////////////////////////////////////////////////////////////
function UpdateClipFlags(path, flags, cbSuccess, cbFailure)
{
	ExecJSON({ cmd: "update", path: path, flags: flags }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			if (typeof cbFailure == "function")
				cbFailure();
			else
				showWarningToast("Failed to update clip properties");
			openLoginDialog();
			return;
		}
		else
		{
			if (typeof cbSuccess == "function")
				cbSuccess();
			else
				showSuccessToast("Clip properties updated");
		}
	}, function ()
		{
		});
}
///////////////////////////////////////////////////////////////
// Delete Alert/Clip //////////////////////////////////////////
///////////////////////////////////////////////////////////////
function DeleteAlert(path, isClip, cbSuccess, cbFailure)
{
	var clipOrAlert = isClip ? "clip" : "alert";
	ExecJSON({ cmd: "del" + clipOrAlert, path: path }, function (response)
	{
		if (typeof response.result != "undefined" && response.result == "fail")
		{
			if (typeof cbFailure == "function")
				cbFailure();
			else
				showWarningToast("Failed to delete " + clipOrAlert + ".<br/>" + (isAdministratorSession ? ("The " + clipOrAlert + " may be still recording.") : ("You need administrator permission to delete " + clipOrAlert + "s.")), 5000);
			if (!isAdministratorSession)
				openLoginDialog();
			return;
		}
		else
		{
			if (typeof cbSuccess == "function")
				cbSuccess();
			else
				showSuccessToast(clipOrAlert + " deleted");
		}
	}, function ()
		{
			if (typeof cbFailure == "function")
				cbFailure();
			else
				showErrorToast('Unable to contact Blue Iris server.', 3000);
		});
}
///////////////////////////////////////////////////////////////
// Get System Configuration ///////////////////////////////////
///////////////////////////////////////////////////////////////
var modal_systemconfigdialog = null;
function GetSysConfig()
{
	if ($("#sysconfigdialog").length == 0)
		ShowSysConfigDialog();
	var $sysconfig = $("#sysconfigcontent");
	if ($sysconfig.length == 0)
		return;
	$sysconfig.html('<div style="text-align: center"><img src="ui2/ajax-loader-clips.gif" alt="Loading..." /></div>');
	ExecJSON({ cmd: "sysconfig" }, function (response)
	{
		if (typeof response.result == "undefined")
		{
			CloseSysConfigDialog();
			showErrorToast("Unexpected response when requesting system configuration from server.");
			return;
		}
		if (response.result == "fail")
		{
			CloseSysConfigDialog();
			openLoginDialog();
			return;
		}
		var $sysconfig = $("#sysconfigcontent");
		if ($sysconfig.length == 0)
			return;
		$sysconfig.empty();
		$sysconfig.append('<div class="camprop_item">' + GetCameraPropertyLabel("Clip Web Archival (FTP)") + GetOnOffButtonMarkup("archive", response.data.archive, "SysConfigCheckChanged") + '</div>');
		$sysconfig.append('<div class="camprop_item">' + GetCameraPropertyLabel("Global Schedule") + GetOnOffButtonMarkup("schedule", response.data.schedule, "SysConfigCheckChanged") + '</div>');
	}, function ()
		{
			showErrorToast('Unable to contact Blue Iris server.', 3000);
			CloseSysConfigDialog();
		});
}
function ShowSysConfigDialog()
{
	CloseSysConfigDialog();
	modal_systemconfigdialog = $('<div id="sysconfigdialog"><div class="sysconfigtitle">' + htmlEncode($("#system_name").text()) + ' System Configuration</div>'
		+ '<div id="sysconfigcontent"></div></div>'
	).modal({ removeElementOnClose: true, maxWidth: 400, maxHeight: 350 });
}
function CloseSysConfigDialog()
{
	if (modal_systemconfigdialog != null)
		modal_systemconfigdialog.close();
	$("#sysconfigdialog").remove();
}
function SysConfigCheckChanged(mysetting, buttonStateIsOn)
{
	SetSysConfig(mysetting, buttonStateIsOn);
}
function SetSysConfig(key, value)
{
	var args = { cmd: "sysconfig" };
	if (key == "archive")
		args.archive = value;
	else if (key == "schedule")
		args.schedule = value;
	else
	{
		showErrorToast('Unknown system configuration key: ' + htmlEncode(key), 3000);
		return;
	}
	ExecJSON(args, function (response)
	{
		if (typeof response.result == "undefined")
		{
			showErrorToast("Unexpected response when attempting to set system configuration on server.");
			return;
		}
		if (response.result == "fail")
		{
			openLoginDialog();
			return;
		}
		showSuccessToast('Set configuration field "' + htmlEncode(key) + '" = "' + htmlEncode(value) + '"');
	}, function ()
		{
			showErrorToast('Unable to contact Blue Iris server to set ' + htmlEncode(key) + ' value.', 3000);
		});
}
///////////////////////////////////////////////////////////////
// System Log /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var modal_systemlogdialog = null;
function GetLog()
{
	if ($("#systemlogdialog").length == 0)
		ShowLogDialog();
	var $syslog = $("#systemlogcontent");
	if ($syslog.length == 0)
		return;
	$syslog.html('<div style="text-align: center; margin-top: 20px;"><img src="ui2/ajax-loader-clips.gif" alt="Loading..." /></div>');
	$("#systemlog_refresh_btn").addClass("spin2s");
	ExecJSON({ cmd: "log" }, function (response)
	{
		if (typeof response.result == "undefined")
		{
			CloseLogDialog();
			showErrorToast("Unexpected response when requesting system log from server.");
			return;
		}
		if (response.result == "fail")
		{
			CloseLogDialog();
			openLoginDialog();
			return;
		}
		var $syslog = $("#systemlogcontent");
		if ($syslog.length == 0)
			return;
		$("#systemlog_refresh_btn").removeClass("spin2s");
		$syslog.html('<table><thead><tr><th></th><th>#</th><th>Time</th><th>Object</th><th>Message</th></tr></thead><tbody></tbody></table>');
		var $tbody = $syslog.find("tbody");
		for (var i = 0; i < response.data.length; i++)
		{
			var data = response.data[i];
			var date = new Date(data.date * 1000)
			var dateStr;
			if (settings.ui2_clipListDateUseLocale == "1")
				dateStr = date.toLocaleString();
			else
				dateStr = GetDateStr(date);
			var level = GetLevelImageMarkup(data.level);
			var count = typeof data.count == "undefined" ? "" : data.count;
			$tbody.append('<tr><td class="levelcolumn">' + level + '</td><td class="centercolumn" style="font-weight: bold;">' + count + '</td><td>' + dateStr + '</td><td style="font-weight: bold;">' + htmlEncode(data.obj) + '</td><td>' + htmlEncode(data.msg) + '</td></tr>');
		}
	}, function ()
		{
			showErrorToast('Unable to contact Blue Iris server.', 3000);
			CloseLogDialog();
		});
}
function GetLevelImageMarkup(level)
{
	if (level == 0)
		return '<img class="icon24" src="ui2/info48.png" style="background-color:#0088FF" alt="info" title="info" />';
	if (level == 1)
		return '<img class="icon24" src="ui2/warning48.png" style="background-color:#FFFF00" alt="warning" title="warning" />';
	if (level == 2)
		return '<img class="icon24" src="ui2/error48.png" style="background-color:#FF0000" alt="error" title="error" />';
	if (level == 3)
		return '<img class="icon24" src="ui2/lightning48.png" style="background-color:#FF0000" alt="motion" title="motion" />';
	if (level == 4)
		return '<img class="icon24" src="ui2/check48.png" style="background-color:#00FF00" alt="motion" title="motion" />';
	if (level == 10)
		return '<img class="icon24" src="ui2/user48.png" style="background-color:#FFFFFF" alt="user" title="user" />';
	return '<span title="Log level ' + level + ' is unknown to UI2">' + level + '</span>';
}
function ShowLogDialog()
{
	CloseLogDialog();
	modal_systemlogdialog = $('<div id="systemlogdialog"><div class="syslogheader">'
		+ '<div class="systemlogtitle">' + $("#system_name").text()
		+ ' System Log <img id="systemlog_refresh_btn" src="ui2/refresh48.png" class="btn24" alt="Refresh" onclick="GetLog()"></div>'
		+ '</div>'
		+ '<div id="systemlogcontent"></div></div>'
	).modal({ removeElementOnClose: true });
}
function CloseLogDialog()
{
	if (modal_systemlogdialog != null)
		modal_systemlogdialog.close();
	$("#systemlogdialog").remove();
}
///////////////////////////////////////////////////////////////
// Save Snapshot in Blue Iris /////////////////////////////////
///////////////////////////////////////////////////////////////
function SaveSnapshotInBlueIris(camId)
{
	if (isLoggingOut)
		return;
	$.ajax(remoteBaseURL + "cam/" + camId + "/pos=100" + GetRemoteSessionArg("?"))
		.done(function (response)
		{
			if (response.indexOf(">Ok<") != -1)
				showSuccessToast("Blue Iris saved a snapshot for camera " + camId);
			else
				showErrorToast("Blue Iris did not save a snapshot for camera " + camId);
		})
		.fail(function ()
		{
			showErrorToast("Blue Iris did not save a snapshot for camera " + camId);
		});
}
///////////////////////////////////////////////////////////////
// Admin Login ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isAdministratorSession = false;
var lastLoginResponse = null;
var latestAPISession = null;
function ApplyLatestAPISessionIfNecessary()
{
	if (latestAPISession == null || isUsingRemoteServer)
		return;
	if ($.cookie("session") != latestAPISession)
	{
		$.cookie("session", latestAPISession, { path: "/" });
		KickstartMjpegStream();
	}
}
function AdminLoginRememberMeChanged()
{
	if ($("#cbRememberMe").is(":checked"))
	{
		settings.bi_rememberMe = "1";
		settings.bi_username = Base64.encode($("#txtUserName").val());
		settings.bi_password = Base64.encode($("#txtPassword").val());
	}
	else
	{
		settings.bi_rememberMe = "0";
		settings.bi_username = "";
		settings.bi_password = "";
	}
}
function DoAdministratorLogin()
{
	AdminLoginRememberMeChanged();
	SessionLogin($("#txtUserName").val(), $("#txtPassword").val());
}
function AdminLoginPasswordKeypress(ele, e)
{
	var keycode;
	if (window.event) keycode = window.event.keyCode;
	else if (typeof e != "undefined" && e) keycode = e.which;
	else return true;

	if (keycode == 13)
	{
		DoAdministratorLogin();
		return false;
	}
	else
		return true;
}
function SessionLogin(user, pass)
{
	if (isUsingRemoteServer)
	{
		$("#system_name").text(remoteServerName);
		onui2_showSystemNameChanged();
	}
	else
		SaveLocalServerName($("#system_name").text());

	var isLoggingInWithCredentials = user != "" || pass != "";
	var oldSession = isUsingRemoteServer ? "" : $.cookie("session");
	var args = { cmd: "login" };
	if (oldSession != "" && !isLoggingInWithCredentials)
		args.session = oldSession;
	ExecJSON(args, function (response)
	{
		lastLoginResponse = response;
		isAdministratorSession = false;
		if (response.result && response.result == "success" && !isLoggingInWithCredentials)
		{
			loginLoaded = true;
			SetLoadedStatus("#loadingLogin");
			HandleSuccessfulLogin("", true);
			return;
		}
		var newSession = typeof response.session == "undefined" ? oldSession : response.session;

		if (isUsingRemoteServer)
			latestAPISession = newSession;

		var myResponse = md5(user + ":" + newSession + ":" + pass);

		ExecJSON({ cmd: "login", response: myResponse, session: newSession }, function (response)
		{
			lastLoginResponse = response;
			if (typeof response.result != "undefined" && response.result == "fail")
			{
				var reason = response.data && response.data.reason ? " " + response.data.reason : "";
				if (isUsingRemoteServer || isLoggingInWithCredentials)
					showErrorToast('Failed to log in.' + reason, 3000);
				if (isUsingRemoteServer)
					HandleRemoteServerFailedToLogin();
				else
				{
					loginLoaded = true;
					SetLoadedStatus("#loadingLogin");
					LoadStatus();
					LoadCameraList();
				}
			}
			else
			{
				loginLoaded = true;
				SetLoadedStatus("#loadingLogin");
				HandleSuccessfulLogin(user, false);
			}
		}, function ()
			{
				showErrorToast('Unable to contact Blue Iris server.', 3000);
				if (isUsingRemoteServer)
					HandleRemoteServerFailedToLogin();
				else
				{
					loginLoaded = true;
					SetLoadedStatus("#loadingLogin");
					LoadCameraList();
				}
			});
	}, function ()
		{
			showErrorToast('Unable to contact Blue Iris server.', 3000);
			if (isUsingRemoteServer)
				HandleRemoteServerFailedToLogin();
			else
			{
				loginLoaded = true;
				SetLoadedStatus("#loadingLogin");
				LoadCameraList();
			}
		});
}
function HandleSuccessfulLogin(user, wasJustCheckingSessionStatus)
{
	$("#system_name").text(lastLoginResponse.data["system name"]);
	onui2_showSystemNameChanged();
	if (!isUsingRemoteServer)
		SaveLocalServerName(lastLoginResponse.data["system name"]);
	latestAPISession = lastLoginResponse.session;
	ApplyLatestAPISessionIfNecessary();
	if (lastLoginResponse.data.admin)
	{
		isAdministratorSession = true;
		if (user == "")
			user = "administrator";
		showSuccessToast("Logged in as " + htmlEncode(user) + "<br/>(Administrator)<br/><br/>Server \"" + lastLoginResponse.data["system name"] + "\"<br/>Blue Iris version " + lastLoginResponse.data.version);
		closeLoginDialog();
	}
	else
	{
		isAdministratorSession = false;
		if (user == "")
			user = "user";
		if (!wasJustCheckingSessionStatus)
			showInfoToast("Logged in as " + htmlEncode(user) + "<br/>(Limited User)<br/><br/>Server \"" + lastLoginResponse.data["system name"] + "\"<br/>Blue Iris version " + lastLoginResponse.data.version);
	}
	try
	{
		if (typeof lastLoginResponse.data.profiles == "object" && lastLoginResponse.data.profiles.length == 8)
		{
			currentProfileNames = lastLoginResponse.data.profiles;
			UpdateProfileStatus();
		}
	}
	catch (exception)
	{
		showWarningToast("Unable to read profile name data from login response");
	}
	LoadStatus();
	LoadCameraList();
}
function HandleRemoteServerFailedToLogin()
{
	SetErrorStatus("#loadingLogin", "Returning to Server List...");
	SetErrorStatus("#loadingCameraList");
	SetErrorStatus("#loadingServerStatus");
	setTimeout(function () { SendToServerListOnStartup(); }, 3000);
}
///////////////////////////////////////////////////////////////
// Image Refreshing ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
var timeLastClipFrame = 0;
var clipPlaybackPosition = 0;
var playbackPaused = false;
var playbackReversed = false;
var lastSnapshotUrl = "";
var currentImageDateMs = new Date();
var concurrentSameImageURLs = 1;
var getNewImageTimeout = null;

var currentlyLoadingImage = new Object();
currentlyLoadingImage.id = "";
currentlyLoadingImage.fullwidth = 1280;
currentlyLoadingImage.fullheight = 720;
currentlyLoadingImage.aspectratio = 1280 / 720;
currentlyLoadingImage.actualwidth = 1280;
currentlyLoadingImage.actualheight = 720;
currentlyLoadingImage.path = "";
currentlyLoadingImage.isLive = true;
currentlyLoadingImage.ptz = false;
currentlyLoadingImage.msec = 10000;
currentlyLoadingImage.isGroup = false;

var currentlyLoadedImage = new Object();
currentlyLoadedImage.id = "";
currentlyLoadedImage.fullwidth = 1280;
currentlyLoadedImage.fullheight = 720;
currentlyLoadedImage.aspectratio = 1280 / 720;
currentlyLoadedImage.actualwidth = 1280;
currentlyLoadedImage.actualheight = 720;
currentlyLoadedImage.path = "";
currentlyLoadedImage.ptz = false;
currentlyLoadedImage.isGroup = false;

var isFirstCameraImageLoaded = false;

var lastCycleWidth = 0;
var lastCycleHeight = 0;
var lastRequestedWidth = 0;
var currentLoadedImageActualWidth = 1;

//var lastWidth = 0;
//var lastHeight = 0;

var isCamimgElementBusy = false;
//var lastImageWasJpegDiff = false;
function StartRefresh()
{
	UpdateSelectedLiveCameraFields();
	ImgResized(false);

	var camObj = $("#camimg");
	camObj.load(function ()
	{
		VideoFrameLoaded($("#camimg").attr('loadingimg'), this.complete, this.naturalWidth, this.naturalHeight, false, false);
	});
	camObj.error(function ()
	{
		ClearImageLoadTimeout();
		//RestartJpegDiffStream();
		setTimeout("GetNewImage();", 1000);
	});
	GetNewImage();
}
function VideoFrameLoaded(lastStartedCameraId, complete, frameWidth, frameHeight, isH264, forceChangedCameraLogic)
{
	isCamimgElementBusy = false;
	ClearImageLoadTimeout();
	if (!complete || typeof frameWidth == "undefined" || frameWidth == 0)
	{
		// Failed
	}
	else
	{
		currentlyLoadedImage.actualwidth = frameWidth;
		currentlyLoadedImage.actualheight = frameHeight;

		if (currentlyLoadingImage.id != currentlyLoadedImage.id || currentlyLoadingImage.path != currentlyLoadedImage.path || forceChangedCameraLogic)
		{
			if (!isFirstCameraImageLoaded)
			{
				isFirstCameraImageLoaded = true;
				RegisterCamImgClickHandler();
			}
			if (lastStartedCameraId == currentlyLoadingImage.id)
			{
				digitalZoom = 0;
				currentlyLoadedImage.id = currentlyLoadingImage.id;
				currentlyLoadedImage.fullwidth = currentlyLoadingImage.fullwidth;
				currentlyLoadedImage.fullheight = currentlyLoadingImage.fullheight;
				currentlyLoadedImage.aspectratio = currentlyLoadingImage.aspectratio;
				currentlyLoadedImage.path = currentlyLoadingImage.path;
				currentlyLoadedImage.ptz = currentlyLoadingImage.ptz;
				currentlyLoadedImage.isGroup = currentlyLoadingImage.isGroup;

				currentlyLoadedCamera = currentlyLoadingCamera;

				resized();
			}
		}
	}

	$("#fpsCounter").html("FPS<br/>" + fps.getFPS());

	if (currentlyLoadedImage.id.startsWith("@"))
	{
		if (lastCycleWidth != frameWidth || lastCycleHeight != frameHeight)
		{
			currentlyLoadedImage.fullwidth = lastCycleWidth = frameWidth;
			currentlyLoadedImage.fullheight = lastCycleHeight = frameHeight;
			currentlyLoadedImage.aspectratio = lastCycleWidth / lastCycleHeight;
			resized();
		}
	}
	else
		lastCycleWidth = lastCycleHeight = 0

	currentLoadedImageActualWidth = frameWidth;

	//var sizeChanged = false;
	//if (lastWidth != frameWidth || lastHeight != frameHeight)
	//{
	//	lastWidth = frameWidth;
	//	lastHeight = frameHeight;
	//	sizeChanged = true;
	//}
	if (isH264)
	{
		ApplyVideoFilterToH264CanvasIfEnabled();
	}
	else
	{
		if ($("#camimg").attr("useMjpeg") == "1")
		{
			// This is mjpeg- so the image will keep refreshing without intervention.
		}
		else
		{
			//if (sizeChanged && $("#camimg").attr("jpegDiff") == "1")
			//	diffJpegFrameNumber = 0; // The server will have restarted our stream.
			DrawToCanvas();
			var timeToWait = parseInt(settings.ui2_timeBetweenJpegImageUpdates);
			if (timeToWait > 0)
				setTimeout("GetNewImage();", timeToWait);
			else
				GetNewImage();
		}
	}
}
function GetNewImage()
{
	ClearGetNewImageTimeout();
	if (isLoggingOut)
		return;
	ApplyLatestAPISessionIfNecessary();
	if (h264Player.isEnabled())
	{
		GetNewImageAfterTimeout();
		return;
	}
	var seekingEnabled = settings.ui2_clipPlaybackSeekBarEnabled == "1";
	var timeValue = currentImageDateMs = new Date().getTime();
	var isLoadingRecordedSnapshot = false;
	if (!currentlyLoadingImage.isLive)
	{
		var timePassed = timeValue - timeLastClipFrame;
		timeLastClipFrame = timeValue;
		var speedMultiplier = GetClipPlaybackSpeedMultiplier();
		timePassed *= speedMultiplier;
		clipPlaybackPosition += timePassed;
		if (seekingEnabled)
		{
			var loopingEnabled = settings.ui2_clipPlaybackLoopEnabled == "1";
			var autoplayEnabled = settings.ui2_clipPlaybackAutoplayEnabled == "1";
			if (clipPlaybackPosition < 0)
			{
				clipPlaybackPosition = 0;
				if (playbackReversed)
				{
					if (loopingEnabled)
						clipPlaybackPosition = currentlyLoadingImage.msec - 1;
					else if (autoplayEnabled)
					{
						Playback_Pause();
						if (settings.ui2_autoplayReverse == "1")
							Playback_NextClip();
						else
							Playback_PreviousClip();
					}
					else
						Playback_Pause();
					if (clipPlaybackPosition < 0)
						clipPlaybackPosition = 0;
				}
			}
			else if (clipPlaybackPosition >= currentlyLoadingImage.msec)
			{
				clipPlaybackPosition = currentlyLoadingImage.msec - 1;
				if (!playbackReversed)
				{
					if (loopingEnabled)
						clipPlaybackPosition = 0;
					else if (autoplayEnabled)
					{
						Playback_Pause();
						if (settings.ui2_autoplayReverse == "1")
							Playback_PreviousClip();
						else
							Playback_NextClip();
					}
					else
						Playback_Pause();
					if (clipPlaybackPosition < 0)
						clipPlaybackPosition = 0;
				}
			}
		}
		timeValue = clipPlaybackPosition;
		// Update currentImageDateMs so that saved snapshots know the time for file naming
		var clipData = GetCachedClip(currentlyLoadingImage.id, currentlyLoadingImage.path);
		if (clipData != null)
		{
			currentImageDateMs = clipData.date.getTime() + clipPlaybackPosition;
			isLoadingRecordedSnapshot = clipData.isSnapshot;
		}
	}

	// Calculate the size of the image we need
	var imgDrawWidth = currentlyLoadingImage.fullwidth * settings.ui2_dpiScalingFactor * (zoomTable[digitalZoom]);
	var imgDrawHeight = currentlyLoadingImage.fullheight * settings.ui2_dpiScalingFactor * (zoomTable[digitalZoom]);
	if (imgDrawWidth == 0)
	{
		// Image is supposed to scale to fit the screen
		imgDrawWidth = $("#layoutbody").width() * settings.ui2_dpiScalingFactor;
		imgDrawHeight = $("#layoutbody").height() * settings.ui2_dpiScalingFactor;

		var availableRatio = imgDrawWidth / imgDrawHeight;
		if (availableRatio < currentlyLoadingImage.aspectratio)
			imgDrawHeight = imgDrawWidth / currentlyLoadingImage.aspectratio;
		else
			imgDrawWidth = imgDrawHeight * currentlyLoadingImage.aspectratio;
	}
	var maxWidth = parseInt(settings.ui2_maxImageWidth);
	var maxHeight = parseInt(settings.ui2_maxImageHeight);
	if (imgDrawWidth > maxWidth || imgDrawHeight > maxHeight)
	{
		// Image is supposed to scale to fit user-imposed dimensions.
		imgDrawWidth = maxWidth;
		imgDrawHeight = maxHeight;

		var availableRatio = imgDrawWidth / imgDrawHeight;
		if (availableRatio < currentlyLoadingImage.aspectratio)
			imgDrawHeight = imgDrawWidth / currentlyLoadingImage.aspectratio;
		else
			imgDrawWidth = imgDrawHeight * currentlyLoadingImage.aspectratio;
	}
	// Now we have the size we need.  Determine what argument we will send to Blue Iris
	var widthToRequest = parseInt(Math.round(imgDrawHeight * currentlyLoadingImage.aspectratio));
	$("#camimg").attr('loadingimg', currentlyLoadingImage.id);

	var qualityArg = "";
	if (settings.ui2_currentImageQuality == 0)
	{
		qualityArg = "&q=" + settings.ui2_lowQualityJpegQualityValue;
		widthToRequest = parseInt(widthToRequest * settings.ui2_lowQualityJpegSizeMultiplier);
	}

	var imgSrcPath;
	if (settings.ui2_useMjpeg == "1")
	{
		$("#camimg").attr("useMjpeg", "1");
		if (currentlyLoadingImage.isLive)
			imgSrcPath = remoteBaseURL + "mjpg/" + currentlyLoadingImage.path + '/video.mjpg?time=' + timeValue + GetRemoteSessionArg("&", true);
		else
			imgSrcPath = remoteBaseURL + "file/clips/" + currentlyLoadingImage.path + '?&mode=mjpeg&speed=100' + GetRemoteSessionArg("&", true);
	}
	else
	{
		$("#camimg").attr("useMjpeg", "0");
		if (currentlyLoadingImage.isLive)
			lastSnapshotUrl = remoteBaseURL + "image/" + currentlyLoadingImage.path + '?time=' + timeValue + GetRemoteSessionArg("&", true);
		else
			lastSnapshotUrl = remoteBaseURL + "file/clips/" + currentlyLoadingImage.path + '?time=' + timeValue + GetRemoteSessionArg("&", true);
		imgSrcPath = lastSnapshotUrl + "&w=" + widthToRequest + qualityArg;
	}
	if ($("#camimg").attr('src') == imgSrcPath)
		GetNewImageAfterTimeout();
	else
	{
		if (seekingEnabled && !currentlyLoadingImage.isLive)
			SetSeekbarPositionByPlaybackTime(timeValue);

		//if (serverJpegDiffStreamVersions.indexOf(clientJpegDiffStreamVersion) != -1 && settings.ui2_enableCanvasDrawing == "1" && settings.ui2_jpegDiffEnabled == "1")
		//{
		//	// jpegDiff algorithm active
		//	$("#camimg").attr("jpegDiff", "1");
		//	$("#camimg").attr("jpegDiffVersion", clientJpegDiffStreamVersion);
		//	imgSrcPath += "&streamid=" + myUID + "&jdq=" + parseInt(settings.ui2_jpegDiffCompressionQuality) + "&jdv=" + clientJpegDiffStreamVersion;
		//	if (!lastImageWasJpegDiff)
		//		RestartJpegDiffStream();
		//	else
		//		RestartJpegDiffStreamIfTimeForNewKeyframe();
		//	if (startOverJpegDiff)
		//	{
		//		startOverJpegDiff = false;
		//		imgSrcPath += "&startNewStream=1";
		//	}
		//	lastImageWasJpegDiff = true;
		//}
		//else
		//{
		//	lastImageWasJpegDiff = false;
		//	$("#camimg").attr("jpegDiff", "0");
		//}
		if ((isLoadingRecordedSnapshot
			&& currentlyLoadingImage.path == currentlyLoadedImage.path
			&& !CouldBenefitFromWidthChange(widthToRequest))
			|| hlsPlayerIsBlockingJpegRefresh()
			|| JpegSuppressionDialogIsOpen()
		)
			GetNewImageAfterTimeout();
		else
		{
			lastRequestedWidth = widthToRequest;
			concurrentSameImageURLs = 1;
			SetImageLoadTimeout();
			$("#camimg").attr('src', imgSrcPath);
			isCamimgElementBusy = true;
		}
	}
}
function CouldBenefitFromWidthChange(newWidth)
{
	return newWidth > lastRequestedWidth && currentLoadedImageActualWidth >= lastRequestedWidth;
}
function GetNewImageAfterTimeout()
{
	// <summary>Calls GetNewImage after increasing delay, to reduce CPU usage a bit while idling</summary>
	getNewImageTimeout = setTimeout(GetNewImage, Math.min(500, 25 + 2 * concurrentSameImageURLs++));
}
function ClearGetNewImageTimeout()
{
	if (getNewImageTimeout != null)
	{
		clearTimeout(getNewImageTimeout);
		getNewImageTimeout = null;
	}
}
var imgLoadTimeout = null;
function SetImageLoadTimeout()
{
	ClearImageLoadTimeout();
	imgLoadTimeout = setTimeout(function ()
	{
		try
		{
			console.log("Image load timed out");
		} catch (ex) { }
		//RestartJpegDiffStream();
		GetNewImage();
	}, 15000);
}
function ClearImageLoadTimeout()
{
	if (imgLoadTimeout != null)
		clearTimeout(imgLoadTimeout);
}
var kickstartMjpegTimeout1 = null;
var kickstartMjpegTimeout2 = null;
function KickstartMjpegStream()
{
	if (kickstartMjpegTimeout1 != null)
		clearTimeout(kickstartMjpegTimeout1);
	kickstartMjpegTimeout1 = setTimeout(function () { if (settings.ui2_useMjpeg == "1") GetNewImage(); }, 5000);
	if (kickstartMjpegTimeout2 != null)
		clearTimeout(kickstartMjpegTimeout2);
	kickstartMjpegTimeout2 = setTimeout(function () { if (settings.ui2_useMjpeg == "1") GetNewImage(); }, 10000);
}
function GetClipPlaybackSpeedMultiplier()
{
	return internalGetClipPlaybackSpeedMultiplier() * (playbackReversed ? -1 : 1);
}
function internalGetClipPlaybackSpeedMultiplier()
{
	if (playbackPaused)
		return 0;
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return 256;
		case "128":
			return 128;
		case "64":
			return 64;
		case "32":
			return 32;
		case "16":
			return 16;
		case "8":
			return 8;
		case "4":
			return 4;
		case "2":
			return 2;
		case "1":
			return 1;
		case "1/2":
			return 0.5;
		case "1/4":
			return 0.25;
		case "1/8":
			return 0.125;
		default:
			return 1;
	}
}
function GetClipPlaybackSpeedLabel()
{
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return "256x";
		case "128":
			return "128x";
		case "64":
			return "64x";
		case "32":
			return "32x";
		case "16":
			return "16x";
		case "8":
			return "8x";
		case "4":
			return "4x";
		case "2":
			return "2x";
		case "1":
			return "1x";
		case "1/2":
			return "1/2x";
		case "1/4":
			return "1/4x";
		case "1/8":
			return "1/8x";
		default:
			return "?";
	}
}
function GetSlowerClipPlaybackSpeed()
{
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return "128";
		case "128":
			return "64";
		case "64":
			return "32";
		case "32":
			return "16";
		case "16":
			return "8";
		case "8":
			return "4";
		case "4":
			return "2";
		case "2":
			return "1";
		case "1":
			return "1/2";
		case "1/2":
			return "1/4";
		case "1/4":
			return "1/8";
		case "1/8":
			return "1/8";
		default:
			return "1";
	}
}
function GetFasterClipPlaybackSpeed()
{
	switch (settings.ui2_clipPlaybackSpeed)
	{
		case "256":
			return "256";
		case "128":
			return "256";
		case "64":
			return "128";
		case "32":
			return "64";
		case "16":
			return "32";
		case "8":
			return "16";
		case "4":
			return "8";
		case "2":
			return "4";
		case "1":
			return "2";
		case "1/2":
			return "1";
		case "1/4":
			return "1/2";
		case "1/8":
			return "1/4";
		default:
			return "1";
	}
}
function UpdateClipPlaybackSpeedLabel()
{
	$("#playback_speed").text(GetClipPlaybackSpeedLabel());
}
function Playback_Pause()
{
	if (!playbackPaused)
		Playback_PlayPause();
}
function Playback_Play()
{
	if (playbackPaused)
		Playback_PlayPause();
}
function Playback_PlayPause()
{
	if (playbackPaused)
	{
		playbackPaused = false;
		$("#playback_playpause").attr("src", "ui2/pause48.png");
		if (clipPlaybackPosition >= currentlyLoadingImage.msec - 1 && !playbackReversed)
			clipPlaybackPosition = 0;
		else if (clipPlaybackPosition <= 0 && playbackReversed)
			clipPlaybackPosition = currentlyLoadingImage.msec - 1;
		if (clipPlaybackPosition < 0)
			clipPlaybackPosition = 0;
	}
	else
	{
		playbackPaused = true;
		$("#playback_playpause").attr("src", "ui2/play48.png");
	}
	UpdateClipPlaybackSpeedLabel();
}
function Playback_SlowDown()
{
	settings.ui2_clipPlaybackSpeed = GetSlowerClipPlaybackSpeed();
	UpdateClipPlaybackSpeedLabel();
}
function Playback_SpeedUp()
{
	settings.ui2_clipPlaybackSpeed = GetFasterClipPlaybackSpeed();
	UpdateClipPlaybackSpeedLabel();
}
function Playback_Skip(amountMs)
{
	clipPlaybackPosition += amountMs;
}
function Playback_NextClip()
{
	var $clip = GetClipAboveClip($(".cliptile.selected"));
	Playback_ClipObj($clip);
}
function Playback_PreviousClip()
{
	var $clip = GetClipBelowClip($(".cliptile.selected"));
	Playback_ClipObj($clip);
}
function Playback_ClipObj($clip)
{
	if ($clip != null && $clip.length > 0)
	{
		var offset = ($("#clipsbody").height() / 2) - ($clip.height() / 2);
		$("#clipsbody").scrollTop(($("#clipsbody").scrollTop() + $clip.position().top) - offset);
		$clip.click();
	}
}
// Next / Previous Clip Helpers
function GetClipIdFromClip($clip)
{
	try
	{
		return $clip.attr('id').substr(1);
	}
	catch (ex)
	{
		return "";
	}
}
function GetClipBelowClip($clip)
{
	var clipIdx = GetClipIndexFromClipId(GetClipIdFromClip($clip));
	if (clipIdx != -1 && clipIdx + 1 < lastLoadedClipIds.length)
		return $("#c" + lastLoadedClipIds[clipIdx + 1]);
	return null;
}
function GetClipAboveClip($clip)
{
	var clipIdx = GetClipIndexFromClipId(GetClipIdFromClip($clip));
	if (clipIdx > 0 && clipIdx - 1 < lastLoadedClipIds.length)
		return $("#c" + lastLoadedClipIds[clipIdx - 1]);
	return null;
}
function GetClipIndexFromClipId(clipId)
{
	if (lastLoadedClipIds == null || lastLoadedClipIds.length == 0)
		return -1;
	for (var i = 0; i < lastLoadedClipIds.length; i++)
	{
		if (lastLoadedClipIds[i] == clipId)
			return i;
	}
	return -1;
}
// End of Helpers
function Playback_Reverse()
{
	if (playbackReversed)
	{
		playbackReversed = false;
		$("#playback_reverse").attr("src", "ui2/fastforward48.png");
		if (playbackPaused && clipPlaybackPosition <= 0)
			Playback_PlayPause();
	}
	else
	{
		playbackReversed = true;
		$("#playback_reverse").attr("src", "ui2/rewind48.png");
		if (playbackPaused && clipPlaybackPosition >= currentlyLoadingImage.msec - 1)
			Playback_PlayPause();
	}
}
function Playback_Loop_Toggle()
{
	if (settings.ui2_clipPlaybackLoopEnabled == "1")
	{
		settings.ui2_clipPlaybackLoopEnabled = "0";
		$("#playback_loop").addClass("disabled");
	}
	else
	{
		settings.ui2_clipPlaybackLoopEnabled = "1";
		$("#playback_loop").removeClass("disabled");

		settings.ui2_clipPlaybackAutoplayEnabled = "0";
		$("#playback_autoplay").addClass("disabled");
	}
}
function Playback_AutoPlay_Toggle()
{
	if (settings.ui2_clipPlaybackAutoplayEnabled == "1")
	{
		settings.ui2_clipPlaybackAutoplayEnabled = "0";
		$("#playback_autoplay").addClass("disabled");
	}
	else
	{
		settings.ui2_clipPlaybackAutoplayEnabled = "1";
		$("#playback_autoplay").removeClass("disabled");

		settings.ui2_clipPlaybackLoopEnabled = "0";
		$("#playback_loop").addClass("disabled");
	}
}
function InitPlaybackLogic()
{
	UpdateClipPlaybackSpeedLabel();

	if (settings.ui2_clipPlaybackLoopEnabled != "1")
		$("#playback_loop").addClass("disabled");

	if (settings.ui2_clipPlaybackAutoplayEnabled != "1")
		$("#playback_autoplay").addClass("disabled");
}
function InitQualityButtonLogic()
{
	if (settings.ui2_currentImageQuality != 1 && settings.ui2_currentImageQuality != 0)
		settings.ui2_currentImageQuality = 1;
	SetQualityButtonGraphic();
	$("#quality").click(function ()
	{
		if (settings.ui2_currentImageQuality == 1)
			settings.ui2_currentImageQuality = 0;
		else
			settings.ui2_currentImageQuality = 1;
		SetQualityButtonGraphic();
	});
}
function SetQualityButtonGraphic()
{
	if (settings.ui2_currentImageQuality == 1)
	{
		$("#quality_low").hide();
		$("#quality_high").show();
	}
	else
	{
		$("#quality_low").show();
		$("#quality_high").hide();
	}
}
///////////////////////////////////////////////////////////////
// Audio Playback /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function audioToggle()
{
	if (currentlyLoadingImage.audio)
	{
		var audiosourceobj = document.getElementById("audiosourceobj");
		if ($("#audiosourceobj").attr("src") == "")
			audioPlay();
		else
			audioStop();
	}
}
function audioPlay()
{
	if (isLoggingOut)
		return;
	$("#audio_icon").attr("src", "ui2/high96.png");
	$("#audiosourceobj").attr("src", remoteBaseURL + "audio/" + currentlyLoadingImage.id + "/temp.wav" + GetRemoteSessionArg("?", true));
	var audioobj = document.getElementById("audioobj");
	audioobj.load();
	audioobj.play();
}
function audioStop()
{
	$("#audio_icon").attr("src", "ui2/mute96.png");
	if ($("#audiosourceobj").attr("src") != "")
	{
		$("#audiosourceobj").attr("src", "");
		document.getElementById("audioobj").load();
	}
}
///////////////////////////////////////////////////////////////
// Save Snapshot Button ///////////////////////////////////////
///////////////////////////////////////////////////////////////
function saveSnapshot()
{
	if (settings.ui2_useMjpeg == "1")
	{
		$("#save_snapshot_btn").attr("download", "temp.jpg");
		$("#save_snapshot_btn").attr("href", "javascript:void(0)");
		showErrorToast("You can not save snapshots while using the experimental Frame Rate Boost option.");
	}
	else
	{
		var camId = currentlyLoadingImage.id;
		if (camId.startsWith("@") || camId.startsWith("+"))
			camId = camId.substr(1);
		var date = GetDateStr(new Date(currentImageDateMs), true);
		date = date.replace(/\//g, '-').replace(/:/g, '.');
		var fileName = camId + " " + date + ".jpg";
		$("#save_snapshot_btn").attr("download", fileName);
		$("#save_snapshot_btn").attr("href", lastSnapshotUrl);
		setTimeout(function ()
		{
			$("#save_snapshot_btn").attr("download", "temp.jpg");
			$("#save_snapshot_btn").attr("href", "javascript:void(0)");
		}, 0);
	}
}
///////////////////////////////////////////////////////////////
// H.264 Playback /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isFirstH264TogglerSetup = true;
var h264PlayerScriptPath = "ui2/broadway.min.js";
var HasFetchStreaming = typeof Response != "undefined" && typeof new Response().body == "object";
function SetupH264Toggler()
{
	if (isFirstH264TogglerSetup)
	{
		isFirstH264TogglerSetup = false;
		$("#h264Toggler").click(ToggleH264Streaming);
	}
	$("#h264Toggler").html("Streaming:<br/>" + (settings.ui2_streamH264 == "1" ? "H.264" : "JPEG"));
	if (IsH264Eligible())
		$("#h264Toggler").show();
	else
		$("#h264Toggler").hide();
}
function ToggleH264Streaming()
{
	if (h264Player.isEnabled() || !IsH264Eligible())
	{
		settings.ui2_streamH264 = "0";
		h264Player.Disable();
	}
	else
	{
		settings.ui2_streamH264 = "1";
		h264Player.Enable();
	}
}
function IsH264Eligible()
{
	return HasFetchStreaming && currentlyLoadingImage.isLive && settings.ui2_enableCanvasDrawing == "1";
}
function NewCanvasInjected()
{
	SetCanvasVisibility();
	register_Camimg_Canvas_ContextMenu();
	ImgResized(false);
	UI2_CustomEvent.Invoke("Canvas_Replaced");
}
function H264Player()
{
	var self = this;
	var broadwayScriptState = 0;
	var myDecoder = null;
	var enableH264 = false;

	var TryLoadH264Player = function (callbackSuccess)
	{
		if (broadwayScriptState == 0)
		{
			broadwayScriptState = 1;
			$.cachedScript(h264PlayerScriptPath + "?v=" + ui2_version)
				.done(function (script, textStatus)
				{
					broadwayScriptState = 2;
					callbackSuccess();
				})
				.fail(function (jqxhr, arg_settings, exception)
				{
					// TODO: Test this
					broadwayScriptState = 0;
					settings.ui2_streamH264 = "0";
					showErrorToast("Failed to load H.264 player script " + h264PlayerScriptPath + " from server.");
					enableH264 = false;
					SetupH264Player();
				});
			return true;
		}
		return false;
	}
	var SetupH264Player = function (callbackH264Success)
	{
		if (myDecoder != null)
			myDecoder.StopStreaming();
		if (enableH264)
		{
			if (TryLoadH264Player(function () { SetupH264Player(callbackH264Success); }))
				return;
			if (broadwayScriptState == 2)
			{
				if (settings.ui2_enableVideoFilter != "1")
					myDecoder = new H264Decoder(true, function (pic, width, height)
					{
						if (myDecoder == null)
							return;
						VideoFrameLoaded(myDecoder.getCurrentCameraId(), true, width, height, true, myDecoder.GetFrameCount() < 2);
					});
				else
					myDecoder = new H264Decoder(false, function (pic, width, height)
					{
						if (myDecoder == null)
							return;
						var canvas = myDecoder.GetCanvas();
						if (canvas.width != width || canvas.height != height)
						{
							canvas.width = width;
							canvas.height = height;
						}
						var context2d = canvas.getContext("2d");
						var imgData = context2d.getImageData(0, 0, canvas.width, canvas.height);
						var rgba = imgData.data;
						for (var i = 0; i < pic.length; i++)
							rgba[i] = pic[i];
						context2d.putImageData(imgData, 0, 0);

						VideoFrameLoaded(myDecoder.getCurrentCameraId(), true, width, height, true, myDecoder.GetFrameCount() < 2);
					});
				if (typeof callbackH264Success == "function")
					callbackH264Success();
			}
		}
		else
		{
			myDecoder = null;
			$("#camimg_canvas").remove();
			$("#layoutbody").append('<canvas id="camimg_canvas" style="display:none;">Your browser does not support HTML5 canvas.</canvas>');
			NewCanvasInjected();
		}
		SetupH264Toggler();
	}
	this.Enable = function ()
	{
		if (!IsH264Eligible())
			return;
		SetupH264Toggler();
		enableH264 = true;
		SetupH264Player(function ()
		{
			myDecoder.OpenStream(currentlyLoadingImage.id);
		});
	}
	this.Disable = function ()
	{
		SetupH264Toggler();
		if (self.isEnabled())
		{
			enableH264 = false;
			SetupH264Player();
		}
	}
	this.isEnabled = function ()
	{
		return myDecoder != null || broadwayScriptState == "1";
	}
	this.Load = function (cameraId)
	{
		if (!IsH264Eligible())
			return;
		SetupH264Toggler();
		if (settings.ui2_streamH264 != "1")
			return;
		enableH264 = true;
		SetupH264Player(function ()
		{
			myDecoder.OpenStream(cameraId);
		});
	}
	this.Reinitialize = function ()
	{
		if (!isFirstCameraImageLoaded)
			return;
		if (IsH264Eligible() && settings.ui2_streamH264 == "1")
			self.Enable();
		else
			self.Disable();
	}
	this.GetStatus = function ()
	{
		if (myDecoder == null)
			return "Not active";
		else
			return myDecoder.GetStatus();
	}
}

function H264Decoder(optimizedPlayer, callbackOnPictureDecoded)
{
	// If optimizedPlayer is true, rgb frame data will be unavailable for filtering.
	var self = this;

	var decoder = optimizedPlayer ? new Player({ useWorker: settings.ui2_h264DecodeInWorker == "1", workerFile: h264PlayerScriptPath + "?v=" + ui2_version }) : new Decoder({ rgb: true });
	var myCanvas = optimizedPlayer ? null : document.createElement("canvas");
	var streamer = null;
	var hasInjectedCanvas = false;

	var framesSoFarThisStream = 0;

	decoder.onPictureDecoded = function (pic, width, height)
	{
		framesSoFarThisStream++;

		if (!hasInjectedCanvas)
		{
			hasInjectedCanvas = true;
			$("#camimg_canvas").remove();
			var $h264Canvas = $(self.GetCanvas());
			$h264Canvas.attr("id", "camimg_canvas");
			$("#layoutbody").append($h264Canvas);
			NewCanvasInjected();
		}

		if (typeof callbackOnPictureDecoded == "function")
			callbackOnPictureDecoded(pic, width, height);
	};

	this.OpenStream = function (cameraId)
	{
		self.StopStreaming();
		streamer = new RawH264Streamer(cameraId, function (data)
		{
			decoder.decode(data);
		});
		streamer.start();
		framesSoFarThisStream = 0;
	}
	this.StopStreaming = function ()
	{
		if (streamer != null)
			streamer.stop();
	}
	this.GetCanvas = function ()
	{
		return myCanvas != null ? myCanvas : decoder.canvas;
	}
	this.getCurrentCameraId = function ()
	{
		return streamer.getCurrentCameraId();
	}
	this.GetFrameCount = function ()
	{
		return framesSoFarThisStream;
	}
	this.GetStatus = function ()
	{
		if (streamer == null)
			return "Not streaming yet";
		else
			return "Frames This Stream: " + framesSoFarThisStream + "\n" + streamer.GetStatus();
	}
}
function RawH264Streamer(cameraId, callbackNALUnitReady)
{
	if (typeof callbackNALUnitReady != "function")
		return;

	var self = this;

	var fetcher = null;
	var reader = null;

	var abort = false;
	var isStreaming = false;
	var hasStarted = false;

	var bytesReadSoFar = 0;
	var NALUnitsSoFar = 0;

	var NALStart = -1;
	var NALBuf = [];
	var seekState = 0;

	this.start = function ()
	{
		if (hasStarted)
		{
			showErrorToast("This RawH264Streamer has already been used");
			return;
		}
		hasStarted = true;
		isStreaming = true;
		fetch(remoteBaseURL + 'h264/' + cameraId + '/temp.h264' + GetRemoteSessionArg('?', true))
			.then(function (res)
			{
				bytesReadSoFar = 0;

				reader = res.body.getReader();
				return pump();
			})
			.catch(function (e)
			{
				isStreaming = false;
				showErrorToast("H.264 stream failed: " + e);
			});
	}
	this.stop = function ()
	{
		abort = true;
		isStreaming = false;
		if (reader != null)
			reader.cancel("Streaming canceled");
	}
	this.getCurrentCameraId = function ()
	{
		return cameraId;
	}
	var pump = function ()
	{
		reader.read().then(function (result)
		{
			if (abort)
			{
				isStreaming = false;
				return;
			}
			if (result.done)
			{
				isStreaming = false;
				showInfoToast("H.264 stream ended");
				return;
			}

			var buf = result.value;

			for (var i = 0; i < buf.byteLength; i++)
			{
				if (GetSeekState(buf[i]) == 4)
				{
					// Found NAL unit sentinel value (4 bytes: [0, 0, 0, 1])
					// i + 1 is the index of the first byte after a sentinel value

					if (NALBuf.length > 0) // NalBuf.length == 0 when the first NAL hasn't been started yet.
					{
						if (NALStart == -1)
							NALStart = 0;
						var NALEnd = i - 3;
						AddToNALBuf(buf, NALStart, NALEnd);

						NALUnitsSoFar++;

						// Send complete NAL Unit to player
						var copy = GetNALBufComplete();
						callbackNALUnitReady(copy);

						ResetNALBuf();
					}
					NALStart = i + 1;
					AddSentinelValueToNALBuf();
				}
			}
			if (NALStart == -1)
			{
				// No NAL unit started or ended in this buffer
				AddToNALBuf(buf, 0, buf.length);
			}
			else
			{
				// A NAL started within this buffer, but did not end
				AddToNALBuf(buf, NALStart, buf.length);
				NALStart = -1;
			}

			bytesReadSoFar += buf.byteLength;

			return pump();
		});
	}

	var GetSeekState = function (currentByte)
	{
		// This method returns 4 when [currentByte] is the 1 at the end of the sequence: [0, 0, 0, 1]
		if (currentByte == 0 && seekState > -1 && seekState < 3)
			seekState++;
		else if (seekState == 3 && currentByte == 1)
			seekState = 4;
		else
			seekState = 0;
		return seekState;
	}
	var ResetNALBuf = function ()
	{
		NALBuf = [];
	}
	var AddSentinelValueToNALBuf = function ()
	{
		NALBuf.push(new Uint8Array([0, 0, 0, 1]));
	}
	var AddToNALBuf = function (buf, idxStart, idxEnd)
	{
		NALBuf.push(buf.subarray(idxStart, idxEnd));
	}
	var GetNALBufComplete = function ()
	{
		var totalSize = 0;
		for (var i = 0; i < NALBuf.length; i++)
			totalSize += NALBuf[i].length;
		var tmpBuf = new Uint8Array(totalSize);
		var tmpIdx = 0;
		for (var i = 0; i < NALBuf.length; i++)
			for (var n = 0; n < NALBuf[i].length; n++)
				tmpBuf[tmpIdx++] = NALBuf[i][n];
		return tmpBuf;
	}
	this.GetStatus = function ()
	{
		return "Bytes Read: " + bytesReadSoFar + "\nNAL Units:" + NALUnitsSoFar;
	}
}
///////////////////////////////////////////////////////////////
// Dropdown Lists /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var timeoutHideDropdownListSelector = null;
var dropdownWasJustShown = false;
var dropdownShownTimeout = null;
function InitDropdownListLogic()
{
	$(document).mouseup(function (e)
	{
		if (dropdownWasJustShown)
			return;
		if (timeoutHideDropdownListSelector != null)
			clearTimeout(timeoutHideDropdownListSelector);
		timeoutHideDropdownListSelector = setTimeout('$(".dropdown_list").hide();', 1);
	});
	$(document).mouseleave(function (e)
	{
		if (dropdownWasJustShown)
			return;
		if (timeoutHideDropdownListSelector != null)
			clearTimeout(timeoutHideDropdownListSelector);
		timeoutHideDropdownListSelector = setTimeout('$(".dropdown_list").hide();', 1);
	});
}
function LoadDropdownList(anchorId, listId)
{
	if (timeoutHideDropdownListSelector != null)
		clearTimeout(timeoutHideDropdownListSelector);

	var box = $("#" + listId);
	if (box.is(":visible"))
	{
		box.hide();
		return;
	}

	$(".dropdown_list").hide();

	var btn = $("#" + anchorId);
	var btnOffset = btn.offset();
	var boxTop = btnOffset.top + btn.outerHeight();
	var boxLeft = btnOffset.left;
	var windowW = $(window).width();
	if (box.width() + boxLeft > windowW)
		boxLeft = windowW - box.width();

	box.css("top", boxTop + "px");
	box.css("left", boxLeft + "px");
	box.show();

	if (box.hasClass("open_on_right"))
	{
		var xOffset = btn.outerWidth(true) - box.outerWidth(true);
		if (xOffset > 0)
			box.css("left", (boxLeft + xOffset) + "px");
	}
	else if (box.hasClass("open_on_left"))
	{
		var newLeft = (btnOffset.left - box.outerWidth(true)) + btn.width();
		if (newLeft >= 0 && newLeft < boxLeft)
			box.css("left", newLeft + "px");
	}

	resized();

	dropdownWasJustShown = true;
	if (dropdownShownTimeout != null)
		clearTimeout(dropdownShownTimeout);
	dropdownShownTimeout = setTimeout('dropdownWasJustShown = false;', 50);
}
///////////////////////////////////////////////////////////////
// Home Camera Group //////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateHomegroupSelector()
{
	var box = $("#homegroupselector");
	box.empty();
	if (typeof (lastCameraListResponse.data) == "undefined" || lastCameraListResponse.data.length == 0)
		return;
	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		var displayName = lastCameraListResponse.data[i].optionDisplay;
		if (CameraIsGroupOrCycle(lastCameraListResponse.data[i]))
		{
			var thisGroupId = JavaScriptStringEncode(lastCameraListResponse.data[i].optionValue);
			var thisGroupName = CleanUpGroupName(lastCameraListResponse.data[i].optionDisplay);
			var thisGroupSelected = currentlySelectedHomeGroupId == lastCameraListResponse.data[i].optionValue;

			box.append('<div' + (thisGroupSelected ? ' class="selected"' : '')
				+ ' onclick="SelectCameraGroup(\'' + thisGroupId + '\')">' + thisGroupName + '</div>');
		}
	}
}
function SelectCameraGroup(groupId)
{
	$("#homegroupselector").hide();

	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		if (lastCameraListResponse.data[i].optionValue == groupId)
		{
			if (CameraIsGroupOrCycle(lastCameraListResponse.data[i]))
			{
				settings.ui2_defaultCameraGroupId = currentlySelectedHomeGroupId = groupId;
				currentlyLoadingCamera = lastCameraListResponse.data[i];

				UpdateSelectedLiveCameraFields();
				break;
			}
		}
	}
}
///////////////////////////////////////////////////////////////
// Alerts/Clips Filter ////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateClipsCameraSelector()
{
	var box = $("#clipscameraselector");
	box.empty();
	if (typeof (lastCameraListResponse.data) == "undefined" || lastCameraListResponse.data.length == 0)
		return;
	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		var displayName = lastCameraListResponse.data[i].optionDisplay;
		if (CameraIsGroupOrCamera(lastCameraListResponse.data[i])
			&& (lastCameraListResponse.data[i].group || lastCameraListResponse.data[i].isEnabled))
		{
			var thisCameraId = JavaScriptStringEncode(lastCameraListResponse.data[i].optionValue);
			var thisGroupName = CleanUpGroupName(lastCameraListResponse.data[i].optionDisplay);
			var thisGroupSelected = currentlySelectedClipGroupId == lastCameraListResponse.data[i].optionValue;

			box.append('<div' + (thisGroupSelected ? ' class="selected"' : '')
				+ ' onclick="SelectClipsCamera(\'' + thisCameraId + '\', true)">' + thisGroupName + '</div>');
		}
	}
}
function SelectClipsCamera(cameraId, alsoLoadClips)
{
	$("#clipscameraselector").hide();

	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		if (lastCameraListResponse.data[i].optionValue == cameraId)
		{
			currentlySelectedClipGroupId = cameraId;
			$("#clipsCameraName").text(CleanUpGroupName(lastCameraListResponse.data[i].optionDisplay));
			if (alsoLoadClips)
				LoadClips(settings.ui2_preferredClipList, lastCameraListResponse.data[i].optionValue);
			break;
		}
	}
}
function ToggleAutoLoadClipList()
{
	settings.ui2_autoLoadClipList = settings.ui2_autoLoadClipList == "1" ? "0" : "1";
	if (settings.ui2_autoLoadClipList == "1")
	{
		$("#btn_autoLoadClipList").addClass("selected");
		LoadClips(settings.ui2_preferredClipList, currentlyLoadingCamera.optionValue);
	}
	else
		$("#btn_autoLoadClipList").removeClass("selected");
}
///////////////////////////////////////////////////////////////
// Schedule Selection /////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateScheduleSelector()
{
	var box = $("#scheduleselector");
	box.empty();
	if (settings.ui2_enableScheduleButton == "1")
	{
		if (globalScheduleEnabled)
		{
			if (lastLoginResponse == null || typeof (lastLoginResponse.data) == "undefined" || typeof (lastLoginResponse.data.schedules) == "undefined" || lastLoginResponse.data.schedules.length == 0)
			{
				openLoginDialog();
				return;
			}
			for (var i = 0; i < lastLoginResponse.data.schedules.length; i++)
			{
				var scheduleName = lastLoginResponse.data.schedules[i];
				box.append('<div' + (scheduleName == currentlySelectedSchedule ? ' class="selected"' : '')
					+ ' onclick="SelectSchedule(\'' + scheduleName + '\')">' + scheduleName + '</div>');
			}
		}
		else
		{
			box.append('<div style="max-width:180px">The global schedule must first be enabled in Blue Iris.</div>');
		}
	}
	else
	{
		box.append('<div style="max-width:180px">Your options do not allow changing the global schedule.</div>');
	}
}
function SelectSchedule(scheduleName)
{
	$("#scheduleselector").hide();
	$("#selectedSchedule").text("...");
	LoadStatus(null, null, scheduleName);
}
///////////////////////////////////////////////////////////////
// Server List Selector ///////////////////////////////////////
///////////////////////////////////////////////////////////////
function PopulateServerlistSelector()
{
	var box = $("#serverlistselector");
	box.empty();
	box.append('<div class="goldenLarger" onclick="openAboutDialog()">About UI2</div>');
	var serverList = GetServerList();
	var addedSeparator = false;
	if (isUsingRemoteServer)
	{
		$(box).find(".goldenLarger").addClass("separatorbelow");
		addedSeparator = true;
		var storedLocalServerName = GetLocalStorage().ui2_localServerName;
		if (storedLocalServerName == "%%SYSNAME%%")
			storedLocalServerName = "Server Selector";
		box.append('<a href="' + location.protocol + '//' + location.host + location.pathname + '">' + htmlEncode(storedLocalServerName) + '</a>');
	}
	for (var i = 0; i < serverList.length; i++)
	{
		var server = serverList[i];
		var linkToServer = location.protocol + '//' + location.host + location.pathname + '?server=' + encodeURIComponent(server.name);
		if (server.name.toLowerCase() != remoteServerName.toLowerCase())
		{
			if (!addedSeparator)
			{
				$(box).find(".goldenLarger").addClass("separatorbelow");
				addedSeparator = true;
			}
			box.append('<a href="' + linkToServer + '">' + server.name + '</a>');
		}
	}
	box.append('<div class="skyblue separatorabove" onclick="ShowServerSelectionDialog()">Manage Servers</div>');
}
///////////////////////////////////////////////////////////////
// Main Menu Selector /////////////////////////////////////////
///////////////////////////////////////////////////////////////
function PrepareMenuSelector()
{
	if (allowUserToChangeSettings)
		$("#btnOptions").show();
	else
		$("#btnOptions").hide();

	if (settings.ui2_showSystemLog == "1")
		$("#btnSystemLog").show();
	else
		$("#btnSystemLog").hide();

	if (settings.ui2_showSystemConfig == "1")
		$("#btnSystemConfig").show();
	else
		$("#btnSystemConfig").hide();
}