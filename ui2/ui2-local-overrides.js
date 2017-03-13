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

//			Settings Key				Value		Options Window	Always Reload	Generation
OverrideDefaultSetting("ui2_timeBetweenJpegImageUpdates", 0, true, false, 0);
OverrideDefaultSetting("ui2_thumbnailLoadingThreads", 3, true, false, 0);
OverrideDefaultSetting("ui2_hideTopBar", "1", true, false, 0);
OverrideDefaultSetting("ui2_audioAutoPlay", "0", true, false, 0);
OverrideDefaultSetting("ui2_safeptz", "1", true, false, 0);
OverrideDefaultSetting("ui2_timeBetweenStatusUpdates", 5000, true, false, 0);
OverrideDefaultSetting("ui2_enableDigitalZoom", "1", true, false, 0);
OverrideDefaultSetting("ui2_showSystemName", "1", true, false, 0);
OverrideDefaultSetting("ui2_showStoplight", "0", true, false, 0);
OverrideDefaultSetting("ui2_enableStoplightButton", "0", true, false, 0);
OverrideDefaultSetting("ui2_showCpuMem", "1", true, false, 0);
OverrideDefaultSetting("ui2_showProfile", "0", true, false, 0);
OverrideDefaultSetting("ui2_enableProfileButtons", "0", true, false, 0);
OverrideDefaultSetting("ui2_showSchedule", "0", true, false, 0);
OverrideDefaultSetting("ui2_enableScheduleButton", "0", true, false, 0);
OverrideDefaultSetting("ui2_showDiskInfo", "0", true, false, 0);
OverrideDefaultSetting("ui2_diskInfoWidth", 250, true, false, 0);
OverrideDefaultSetting("ui2_preferredClipList", "cliplist", true, false, 0);
OverrideDefaultSetting("ui2_dpiScalingFactor", 1, true, false, 0);
OverrideDefaultSetting("ui2_maxImageWidth", 20000, true, false, 0);
OverrideDefaultSetting("ui2_maxImageHeight", 20000, true, false, 0);
OverrideDefaultSetting("ui2_useMjpeg", "0", true, false, 0);
OverrideDefaultSetting("ui2_defaultCameraGroupId", "index", true, false, 0);
OverrideDefaultSetting("ui2_leftBarSize", 210, true, false, 0);
OverrideDefaultSetting("ui2_autoLoadClipList", "0", true, false, 0);