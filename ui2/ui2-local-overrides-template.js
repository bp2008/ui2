/*
	THIS IS FOR ADVANCED USE ONLY
	
	If you want to modify UI2's default behavior, 
	you must rename this file to "ui2-local-overrides.js"
	
	This rename is necessary to prevent your ui2-local-overrides.js from being 
	overwritten when you update UI2.
*/




// If true, an Options button is shown next to the Logout button in the upper right corner of UI2.
// If false, the Options button is removed and the settings contained within are unavailable.
allowUserToChangeSettings = true;

// If you uncomment the following line, then UI2's settings will not persist between sessions.
// settings = new GetDummyLocalStorage();



/* You may override UI2's default settings individually below.

*****     PLEASE READ FIRST    ***** 
***** OR YOU WILL HAVE TROUBLE ***** 

If you change a Settings VALUE below, your change will NOT affect users who have loaded UI2 before.
Those users already have a stored value for the setting, so they will not automatically pick up the 
new default value.

If you want your VALUE change to affect all users, you need to also increment the Generation number.
This lets UI2 know it should adopt the new default value.

Alternatively, if you want your default value to ALWAYS be reloaded when UI2 is loaded, set 
"Always Reload" to true.  Then, the Generation number does not matter.

--------------------

Settings Key	= The name of the setting.
Value		= The default value of the setting.
Options Window 	= If false, causes the setting to not appear in the Options window.  Note that some 
			settings do not appear in the options window anyway.
Always Reload	= If true, causes the default value to replace the stored value every time UI2 loads.
Generation	= Increment this number if you want the default value to replace the current value 
			for all users of UI2.
*/

//			Settings Key						Value			Options Window	Always Reload	Generation
OverrideDefaultSetting("ui2_timeBetweenJpegImageUpdates", 			0,			true,		false,		0);
OverrideDefaultSetting("ui2_thumbnailLoadingThreads", 				3,			true,		false,		0);
OverrideDefaultSetting("ui2_hideTopBar", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_audioAutoPlay", 					"0",			true,		false,		0);
OverrideDefaultSetting("ui2_safeptz", 						"1",			true,		false,		0);
OverrideDefaultSetting("ui2_timeBetweenStatusUpdates", 				5000,			true,		false,		0);
OverrideDefaultSetting("ui2_enableDigitalZoom", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showSystemName", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showStoplight", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showQualityButton", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_enableStoplightButton", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showQualityButton", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_currentImageQuality", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showCpuMem", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showProfile", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_enableProfileButtons",				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showSchedule", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_enableScheduleButton",				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_showDiskInfo", 					"0",			true,		false,		0);
OverrideDefaultSetting("ui2_diskInfoWidth", 					250,			true,		false,		0);
OverrideDefaultSetting("ui2_enableFrameRateCounter", 				"0", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showSaveSnapshotButton", 				"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showHLSButton", 					"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showPtzArrows", 					"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showPtzZoom", 					"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showPtzFocus", 					"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showPtzPresetsGroup1", 				"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showPtzPresetsGroup2", 				"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showSystemLog", 					"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_showSystemConfig", 					"1", 			true, 		false, 		0);
OverrideDefaultSetting("ui2_preferredClipList", 				"cliplist",		true,		false,		0);
OverrideDefaultSetting("ui2_dpiScalingFactor", 					1,			true,		false,		0);
OverrideDefaultSetting("ui2_maxImageWidth", 					20000,			true,		false,		0);
OverrideDefaultSetting("ui2_maxImageHeight", 					20000,			true,		false,		0);
OverrideDefaultSetting("ui2_useMjpeg", 						"0",			true,		false,		0);
OverrideDefaultSetting("ui2_lowQualityJpegQualityValue", 			20,			true,		false,		0);
OverrideDefaultSetting("ui2_lowQualityJpegSizeMultiplier", 			0.3,			true,		false,		0);
OverrideDefaultSetting("ui2_defaultCameraGroupId", 				"index",		true,		false,		0);
OverrideDefaultSetting("ui2_leftBarSize", 					210,			true,		false,		0);
OverrideDefaultSetting("ui2_autoLoadClipList", 					"0",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackSpeed", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackSeekBarEnabled", 			"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackLoopEnabled", 				"0",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackAutoplayEnabled", 			"0",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackControlsMayAppearOnTopBar", 		"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackControlsMayAppearOnTop", 		"0",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackControlsMayAppearOnBottom", 		"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackControlsDisappearWhenCursorIsFar", 	"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipPlaybackControlsMinimumOpacity", 		50,			true,		false,		0);
OverrideDefaultSetting("ui2_autoplayReverse", 					"0",			true,		false,		0);
OverrideDefaultSetting("ui2_alertDelete_requiresConfirmation", 			"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipDelete_requiresConfirmation", 			"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipListZoom", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipListZoomMultiplier", 				1,			true,		false,		0);
OverrideDefaultSetting("ui2_clipPreviewEnabled", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_clipsShowSnapshots", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_snapshotPlaybackTimeSeconds", 			2,			true,		false,		0);
OverrideDefaultSetting("ui2_timeBetweenCameraListUpdates", 			5000,			true,		false,		0);
OverrideDefaultSetting("ui2_sessionTimeout", 					0,			true,		false,		0);
OverrideDefaultSetting("ui2_clipListUseFullCameraName", 			"0",			true,		false,		0);
OverrideDefaultSetting("ui2_enableHotkeys", 					"1",			true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_togglefullscreen",				"1|0|0|192|tilde (~`)", true, 		false, 		0);
OverrideDefaultSetting("ui2_hotkey_togglesidebar",				"0|0|0|192|tilde (~`)", true, 		false, 		0);
OverrideDefaultSetting("ui2_hotkey_downloadframe", 				"1|0|0|83|S",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_playpause", 					"0|0|0|32|space",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_newerClip", 					"0|0|0|38|up arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_olderClip", 					"0|0|0|40|down arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_skipAhead", 					"0|0|0|39|right arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_skipBack", 					"0|0|0|37|left arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_skipAmount", 					10,			true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_playbackFaster", 				"1|0|0|39|right arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_playbackSlower", 				"1|0|0|37|left arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_playbackForwardReverse", 			"1|0|0|32|space",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_digitalZoomIn", 				"0|0|0|187|=",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_digitalZoomOut", 				"0|0|0|189|-",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzUp", 					"0|0|0|38|up arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzDown", 					"0|0|0|40|down arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzLeft", 					"0|0|0|37|left arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzRight", 					"0|0|0|39|right arrow",	true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzIn", 					"1|0|0|187|=",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzOut", 					"1|0|0|189|-",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset1", 				"0|0|0|49|1",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset2", 				"0|0|0|50|2",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset3", 				"0|0|0|51|3",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset4", 				"0|0|0|52|4",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset5", 				"0|0|0|53|5",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset6", 				"0|0|0|54|6",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset7", 				"0|0|0|55|7",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset8", 				"0|0|0|56|8",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset9", 				"0|0|0|57|9",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset10", 				"0|0|0|48|0",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset11", 				"1|0|0|49|1",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset12", 				"1|0|0|50|2",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset13", 				"1|0|0|51|3",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset14", 				"1|0|0|52|4",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset15", 				"1|0|0|53|5",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset16", 				"1|0|0|54|6",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset17", 				"1|0|0|55|7",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset18", 				"1|0|0|56|8",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset19", 				"1|0|0|57|9",		true,		false,		0);
OverrideDefaultSetting("ui2_hotkey_ptzPreset20", 				"1|0|0|48|0",		true,		false,		0);
OverrideDefaultSetting("ui2_clipListDateUseLocale", 				"0",			true,		false,		0);
OverrideDefaultSetting("ui2_doAutoUpdateCheck", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_enableCanvasDrawing", 				"0",			true,		false,		0);
OverrideDefaultSetting("ui2_streamH264", 					"0",			true,		false,		0);
OverrideDefaultSetting("ui2_h264DecodeInWorker", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_enableVideoFilter", 				"0",			true,		false,		0);
OverrideDefaultSetting("ui2_preferredVideoFilter", 				"",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_enabled", 				"0",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_name", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_shortname", 				"0",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_cameraColor", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_fontSize", 				10,			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_minimumFontSize", 			10,			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_fontScaling", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_positionTop", 				"1",			true,		false,		0);
OverrideDefaultSetting("ui2_cameraLabels_topOffset", 				0,			true,		false,		0);