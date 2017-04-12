/* ui2-util.js contains javascript functions that are considered complete and do not change often

Keeping these functions here helps keep ui2.js more tidy.
*/
/// <reference path="ui2.js" />
/// <reference path="ui2-local-overrides.js" />
/// <reference path="jquery-1.11.3.js" />
/// <reference path="jquery.ui2modal.js" />

///////////////////////////////////////////////////////////////
// Draggable Divider //////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isDraggingDivider = false;
var isOverDivider = false;
// Chrome at the time of this writing won't detect the hover exit if the pointer leaves the side of the browser, so this timeout will handle hiding the layout divider.
var layoutDividerHideTimeout = null;
var layoutLeftOriginalWidth = 210;
var lastDividerMouseDownTime = new Date().getTime() - 9999;
var lastDoubleMouseDownStarted = new Date().getTime() - 9999;
var doubleClickTime = 750;
function EnableDraggableDivider()
{
	layoutLeftOriginalWidth = $("#layoutleft").outerWidth(true);
	$("#layoutleft").css("width", parseInt(settings.ui2_leftBarSize) + "px");
	$("#layoutdivider").hover(function ()
	{
		isOverDivider = true;
		if (!isDraggingDivider)
			ShowLayoutDivider();
	}, function ()
		{
			isOverDivider = false;
			if (!isDraggingDivider)
				HideLayoutDivider();
		});
	$("#layoutdivider").on("mousedown touchstart", function (e)
	{
		ShowLayoutDivider();
		if (e.which <= 1)
		{
			var thisTime = new Date().getTime();
			if (thisTime < lastDividerMouseDownTime + doubleClickTime)
				lastDoubleMouseDownStarted = lastDividerMouseDownTime;
			if (typeof e.pageX == "undefined")
				e.pageX = e.originalEvent.touches[0].pageX;
			lastDividerMouseDownTime = thisTime;
			dividerOffsetX = e.pageX - $("#layoutdivider").offset().left;
			isDraggingDivider = true;
			return stopDefault(e);
		}
	});
	$(document).on("mouseup touchend touchcancel", function (e)
	{
		if (new Date().getTime() < lastDoubleMouseDownStarted + doubleClickTime)
			dividerDblClick();
		if (e.which <= 1)
		{
			isDraggingDivider = false;
			if (!isOverDivider)
			{
				layoutDividerHideTimeout = setTimeout(HideLayoutDivider, 3000);
			}
		}
	});
	$(document).on("mousemove touchmove", function (e)
	{
		if (layoutDividerHideTimeout != null)
			clearTimeout(layoutDividerHideTimeout);
		if (isDraggingDivider)
		{
			if (typeof e.pageX == "undefined")
				e.pageX = e.originalEvent.touches[0].pageX;
			var newWidth = (e.pageX - dividerOffsetX);
			if (newWidth < 0)
				newWidth = 0;
			$('#layoutleft').css('width', newWidth + "px");
			resized();
		}
		else
		{
			layoutDividerHideTimeout = setTimeout(HideLayoutDivider, 3000);
		}
	});
}
function dividerDblClick(e)
{
	if (typeof e == "undefined" || e.which <= 1)
	{
		$("#layoutleft").css("width", layoutLeftOriginalWidth + "px");
		resized();
	}
}
function ShowLayoutDivider()
{
	$("#layoutdivider").stop(true);
	$("#layoutdivider").animate({ opacity: 0.8 });
}
function HideLayoutDivider()
{
	$("#layoutdivider").stop(true);
	$("#layoutdivider").animate({ opacity: 0 });
}
///////////////////////////////////////////////////////////////
// Asynchronous Image Downloading /////////////////////////////
///////////////////////////////////////////////////////////////
var asyncImageQueue = new Array();
var currentImageQueueGeneration = -1;
var stopImageQueue = false;
function StopImageQueue()
{
	stopImageQueue = true;
}
function RestartImageQueue()
{
	stopImageQueue = false;
	var numThreads = parseInt(settings.ui2_thumbnailLoadingThreads);
	if (numThreads < 1)
		numThread = 1;
	else if (numThreads > 5)
		numThreads = 5;
	currentImageQueueGeneration++;
	for (var i = 0; i < numThreads; i++)
		AsyncDownloadQueuedImage(currentImageQueueGeneration);
}
function AsyncDownloadQueuedImage(myGeneration)
{
	if (myGeneration != currentImageQueueGeneration || stopImageQueue || isLoggingOut)
		return;
	var obj = popHighestPriorityImage();
	if (obj == null)
		setTimeout("AsyncDownloadQueuedImage(" + myGeneration + ")", 250);
	else
	{
		var src = $(obj.img).attr('src');
		if (!src || src.length == 0 || src == "ui2/LoadingSmall.png" || (src != obj.path && src != 'ui2/nothumb.jpg'))
		{
			$(obj.img).bind("load.asyncimage", function ()
			{
				$(this).css("width", "auto");
				$(this).css("height", "auto");
				$(this).unbind("load.asyncimage");
				$(this).unbind("error.asyncimage");
				AsyncDownloadQueuedImage(myGeneration);
			});
			$(obj.img).bind("error.asyncimage", function ()
			{
				$(this).css("width", "auto");
				$(this).css("height", "auto");
				$(this).unbind("load.asyncimage");
				$(this).unbind("error.asyncimage");
				$(this).attr('src', 'ui2/nothumb.jpg');
				AsyncDownloadQueuedImage(myGeneration);
			});
			$(obj.img).attr('src', obj.path);
		}
		else // Image is already loaded
			AsyncDownloadQueuedImage(myGeneration);
	}
}
function popHighestPriorityImage()
{
	var highest = null;
	var highestIdx = -1;
	for (var i = 0; i < asyncImageQueue.length; i++)
	{
		if (i == 0)
		{
			highest = asyncImageQueue[i];
			highestIdx = i;
		}
	}
	if (highestIdx > -1)
		asyncImageQueue.splice(highestIdx, 1);
	return highest;
}
function enqueueAsyncImage(img, path)
{
	var newObj = new Object();
	newObj.img = img;
	newObj.path = path;
	asyncImageQueue.push(newObj);
}
function dequeueAsyncImage(img)
{
	for (var i = 0; i < asyncImageQueue.length; i++)
	{
		if (asyncImageQueue[i].img == img)
		{
			asyncImageQueue.splice(i, 1);
			return;
		}
	}
}
function emptyAsyncImageQueue()
{
	asyncImageQueue = new Array();
}

///////////////////////////////////////////////////////////////
// Appear / Disappear in clips body logic /////////////////////
///////////////////////////////////////////////////////////////
var aboveAllowance = 500;
var belowAllowance = 1000;
var appearDisappearRegisteredObjects = new Array();
var AppearDisappearCheckEnabled = true;
$(function ()
{
	$(window).resize(appearDisappearCheck);
	$("#clipsbody").scroll(appearDisappearCheck);
});
function appearDisappearCheck()
{
	if (!AppearDisappearCheckEnabled)
		return;
	var scrollTop = $("#clipsbody").scrollTop();
	var yMin = scrollTop - aboveAllowance;
	var yMax = scrollTop + $("#clipsbody").height() + belowAllowance;
	for (var i = 0; i < appearDisappearRegisteredObjects.length; i++)
	{
		var obj = appearDisappearRegisteredObjects[i];
		if (obj.y >= yMin && obj.y <= yMax)
		{
			// obj is Visible (or nearly visible)
			if (!obj.isAppeared)
			{
				obj.isAppeared = true;
				if (obj.callbackOnAppearFunc)
					obj.callbackOnAppearFunc(obj);
			}
		}
		else
		{
			// obj is Not Visible
			if (obj.isAppeared)
			{
				obj.isAppeared = false;
				if (obj.callbackOnDisappearFunc)
					obj.callbackOnDisappearFunc(obj);
			}
		}
	}
}
// This method was not needed and is not supported
//function unregisterOnAppearDisappear(obj)
//{
//	for (var i = 0; i < appearDisappearRegisteredObjects.length; i++)
//	{
//		if (appearDisappearRegisteredObjects[i] == obj)
//		{
//			appearDisappearRegisteredObjects.splice(i, 1);
//			return;
//		}
//	}
//}
function registerOnAppearDisappear(obj, callbackOnAppearFunc, callbackOnDisappearFunc)
{
	obj.isAppeared = false;
	obj.y = appearDisappearRegisteredObjects.length * HeightOfOneClipTilePx;
	obj.callbackOnAppearFunc = callbackOnAppearFunc;
	obj.callbackOnDisappearFunc = callbackOnDisappearFunc;
	appearDisappearRegisteredObjects.push(obj);
}
function unregisterAllOnAppearDisappear()
{
	appearDisappearRegisteredObjects = new Array();
}
///////////////////////////////////////////////////////////////
// JSON ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ExecJSON(args, callbackSuccess, callbackFail, synchronous)
{
	if (isLoggingOut && args.cmd != "logout")
		return;
	ApplyLatestAPISessionIfNecessary();
	var isLogin = args.cmd == "login";
	var oldSession = $.cookie("session");
	if (typeof args.session == "undefined" && !isLogin)
	{
		if (isUsingRemoteServer)
			args.session = latestAPISession;
		else
			args.session = oldSession;
	}
	$.ajax({
		type: 'POST',
		url: remoteBaseURL + "json",
		contentType: "text/plain",
		data: JSON.stringify(args),
		dataType: "json",
		async: !synchronous,
		success: function (data)
		{
			if (isLogin)
				$.cookie("session", oldSession, { path: "/" });
			else if (!isUsingRemoteServer && typeof data.session != "undefined" && data.session != $.cookie("session"))
				$.cookie("session", data.session, { path: "/" });
			if (callbackSuccess)
				callbackSuccess(data);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			if (callbackFail)
				callbackFail(jqXHR, textStatus, errorThrown);
		}
	});
}
///////////////////////////////////////////////////////////////
// Touchscreen Detection //////////////////////////////////////
///////////////////////////////////////////////////////////////
var hasSeenTouchEvent = false;
$(function ()
{
	$(window).bind("touchstart.touchdetect", function ()
	{
		hasSeenTouchEvent = true;
		$(window).unbind("touchstart.touchdetect");
	});
});
///////////////////////////////////////////////////////////////
// Jpeg-diff streaming ////////////////////////////////////////
// Requires UI2Service from https://ui2service.codeplex.com/ //
///////////////////////////////////////////////////////////////
//
// IMPORTANT NOTE: This feature did not meet performance goals, 
// so using it is not recommended. The code to enable jpeg-diff 
// streaming is commented out and will be removed in the future.
//
//var decoderArrayV1 = [-128, -127, -126, -125, -124, -123, -122, -121, -120, -119, -118, -117, -116, -115, -114, -113, -112, -111, -110, -109, -108, -107, -106, -105, -104, -103, -102, -101, -100, -99, -98, -97, -96, -95, -94, -93, -92, -91, -90, -89, -88, -87, -86, -85, -84, -83, -82, -81, -80, -79, -78, -77, -76, -75, -74, -73, -72, -71, -70, -69, -68, -67, -66, -65, -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127];
//var decoderArrayV2 = [-255, -253, -251, -249, -247, -245, -243, -241, -239, -237, -235, -233, -231, -229, -227, -225, -223, -221, -219, -217, -215, -213, -211, -209, -207, -205, -203, -201, -199, -197, -195, -193, -191, -189, -187, -185, -183, -181, -179, -177, -175, -173, -171, -169, -167, -165, -163, -161, -159, -157, -155, -153, -151, -149, -147, -145, -143, -141, -139, -137, -135, -133, -131, -129, -127, -125, -123, -121, -119, -117, -115, -113, -111, -109, -107, -105, -103, -101, -99, -97, -95, -93, -91, -89, -87, -85, -83, -81, -79, -77, -75, -73, -71, -69, -67, -65, -63, -61, -59, -57, -55, -53, -51, -49, -47, -45, -43, -41, -39, -37, -35, -33, -31, -29, -27, -25, -23, -21, -19, -17, -15, -13, -11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 179, 181, 183, 185, 187, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, 251, 253, 255];
//var decoderArrayV3 = [-255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -255, -251, -243, -235, -227, -219, -211, -203, -195, -187, -179, -171, -163, -155, -147, -139, -131, -125, -122, -117, -114, -109, -106, -101, -98, -93, -90, -85, -82, -77, -74, -69, -66, -62, -59, -56, -53, -50, -47, -44, -41, -38, -35, -32, -29, -26, -23, -20, -17, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 67, 70, 75, 78, 83, 86, 91, 94, 99, 102, 107, 110, 115, 118, 123, 126, 132, 140, 148, 156, 164, 172, 180, 188, 196, 204, 212, 220, 228, 236, 244, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255];
//var decoderArrayV4 = [-255, -253, -250, -247, -244, -241, -238, -235, -232, -229, -226, -223, -220, -217, -214, -211, -208, -205, -202, -199, -196, -193, -190, -187, -184, -181, -178, -175, -172, -169, -166, -163, -160, -156, -153, -150, -147, -144, -141, -138, -135, -132, -129, -126, -123, -120, -117, -114, -111, -108, -105, -102, -99, -96, -93, -90, -87, -84, -81, -78, -75, -72, -69, -66, -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 70, 73, 76, 79, 82, 85, 88, 92, 95, 98, 101, 104, 107, 110, 113, 116, 119, 122, 125, 128, 131, 134, 138, 141, 144, 147, 150, 153, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 187, 190, 193, 196, 199, 202, 205, 208, 211, 214, 217, 220, 223, 226, 229, 233, 236, 239, 242, 245, 248, 251, 254];

//var clientJpegDiffStreamVersion = 1;
//var serverJpegDiffStreamVersions = new Array();
//var diffJpegFrameNumber = 0;
//var myUID = generateUIDNotMoreThan1million();
//var startOverJpegDiff = true;
//var timeLastJpegDiffKeyframe = 0;
//function RestartJpegDiffStreamIfTimeForNewKeyframe()
//{
//	if (new Date().getTime() - parseInt(settings.ui2_jpegDiffKeyframeIntervalMs) > timeLastJpegDiffKeyframe)
//		RestartJpegDiffStream();
//}
//function RestartJpegDiffStream()
//{
//	diffJpegFrameNumber = 0;
//	startOverJpegDiff = true;
//	timeLastJpegDiffKeyframe = new Date().getTime();
//}
//function QueryJpegDiffCompatibility()
//{
//	$.ajax("jpegdiffversions")
//	.done(function (response)
//	{
//		try
//		{
//			var strs = response.split('|');
//			for (var i = 0; i < strs.length; i++)
//				serverJpegDiffStreamVersions.push(parseInt(strs[i]));
//			showSuccessToast("Server has jpegdiff versions " + serverJpegDiffStreamVersions.join(','));
//		}
//		catch (ex)
//		{
//		}
//	});
//}
//function HandleJpegDiffImage(applyFilter)
//{
//	if ($("#camimg").attr("jpegDiff") == "1")
//	{
//		if (diffJpegFrameNumber == 0)
//		{
//			// This is a keyframe, so the frame we just received goes straight to the invisible buffer, bypassing the diff frame calculations.
//			CopyImageToCanvas("camimg", "camimg_jpegdiff_canvas", false);
//		}
//		else
//		{
//			// We just received a diff frame.
//			CopyImageToCanvas("camimg", "camimg_jpegdiff_diffframe_canvas", false);
//			ApplyJpegDiffAlgorithm("camimg_jpegdiff_canvas", "camimg_jpegdiff_diffframe_canvas", parseInt($("#camimg").attr("jpegDiffVersion")));
//		}
//		// Copy invisible buffer to the displayed canvas, and apply any necessary filters.
//		CopyCanvasToCanvas("camimg_jpegdiff_canvas", "camimg_canvas", applyFilter);
//		if ($("#video_filter_preview_canvas").length == 1)
//			CopyCanvasToCanvas("camimg_canvas", "video_filter_preview_canvas", !applyFilter);
//		diffJpegFrameNumber++;
//		return true;
//	}
//	return false;
//}
//function ApplyJpegDiffAlgorithm(renderToCanvasId, diffFrameCanvasId, version)
//{
//	var renderToCanvas = $("#" + renderToCanvasId).get(0);
//	var renderToCanvas_context2d = renderToCanvas.getContext("2d");
//	var renderToCanvas_imgData = renderToCanvas_context2d.getImageData(0, 0, renderToCanvas.width, renderToCanvas.height);
//	var rgba = renderToCanvas_imgData.data;

//	var diffFrameCanvas = $("#" + diffFrameCanvasId).get(0);
//	var diffFrameCanvas_context2d = diffFrameCanvas.getContext("2d");
//	var diffFrameCanvas_imgData = diffFrameCanvas_context2d.getImageData(0, 0, diffFrameCanvas.width, diffFrameCanvas.height);
//	var diff_rgba = diffFrameCanvas_imgData.data;

//	//var ctr = -1;
//	// Apply algorithm
//	var decoderArray = decoderArrayV1;
//	if (version == 2)
//		decoder = decoderArrayV2;
//	else if (version == 3)
//		decoder = decoderArrayV3;
//	else if (version == 4)
//		decoder = decoderArrayV4;
//	for (var i = 0; i < rgba.length; i++)
//	{
//		if (rgba[i] == 255 && diff_rgba[i] == 255)
//			continue;
//		var newVal = rgba[i] + decoderArrayV1[diff_rgba[i]]
//		if (newVal < 0)
//			rgba[i] = 0;
//		else if (newVal > 255)
//			rgba[i] = 255;
//		else
//			rgba[i] = newVal;
//	}

//	renderToCanvas_context2d.putImageData(renderToCanvas_imgData, 0, 0);
//}
///////////////////////////////////////////////////////////////
// Canvas Drawing /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// Contains a selector string for the currently visible img or canvas element being used for live rendering.  The value is either "#camimg" or "#camimg_canvas"
var camImgElementSelector = "#camimg";
var customVideoFilter = null;
var video_filter_preview_canvas_cleared = false;
function DrawToCanvas()
{
	if (settings.ui2_enableCanvasDrawing == "1")
	{
		//if (!HandleJpegDiffImage(settings.ui2_enableVideoFilter == "1"))
		//{
		CopyImageToCanvas("camimg", "camimg_canvas", settings.ui2_enableVideoFilter == "1");
		if ($("#video_filter_preview_canvas").length == 1)
		{
			CopyImageToCanvas("camimg", "video_filter_preview_canvas", true);
			video_filter_preview_canvas_cleared = false;
		}
		//}
	}
	else
	{
		if ($("#video_filter_preview_canvas").length == 1 && !video_filter_preview_canvas_cleared)
		{
			video_filter_preview_canvas_cleared = true;
			ClearCanvas("video_filter_preview_canvas");
		}
	}
}
function ClearCanvas(canvasId)
{
	var canvas = $("#" + canvasId).get(0);
	var context2d = canvas.getContext("2d");
	context2d.clearRect(0, 0, canvas.width, canvas.height);
}
function CopyImageToCanvas(imgId, canvasId, applyVideoFilter)
{
	var camimg = $("#" + imgId).get(0);
	var canvas = $("#" + canvasId).get(0);
	canvas.width = camimg.naturalWidth;
	canvas.height = camimg.naturalHeight;

	var context2d = canvas.getContext("2d");
	if (context2d == null)
		return;
	context2d.drawImage(camimg, 0, 0);
	if (applyVideoFilter)
		ApplyVideoFilter(context2d, canvas);
}
function CopyCanvasToCanvas(canvasSourceId, canvasTargetId, applyVideoFilter)
{
	var canvasSource = $("#" + canvasSourceId).get(0);
	var canvasTarget = $("#" + canvasTargetId).get(0);
	canvasTarget.width = canvasSource.width;
	canvasTarget.height = canvasSource.height;

	var canvasTarget_context2d = canvasTarget.getContext("2d");
	canvasTarget_context2d.drawImage(canvasSource, 0, 0);
	if (applyVideoFilter)
		ApplyVideoFilter(canvasTarget_context2d, canvasTarget);
}
function ApplyVideoFilterToH264CanvasIfEnabled()
{
	if (settings.ui2_enableVideoFilter == "1")
	{
		var canvas = $("#camimg_canvas").get(0);
		var context2d = canvas.getContext("2d");
		if (context2d != null)
			ApplyVideoFilter(context2d, canvas);
	}
	if ($("#video_filter_preview_canvas").length == 1)
	{
		var canvasSource = $("#camimg_canvas").get(0);
		var canvasTarget = $("#video_filter_preview_canvas").get(0);
		canvasTarget.width = canvasSource.width;
		canvasTarget.height = canvasSource.height;

		var canvasTarget_context2d = canvasTarget.getContext("2d");
		canvasTarget_context2d.drawImage(canvasSource, 0, 0);
		ApplyVideoFilter(canvasTarget_context2d, canvasTarget);
	}
}
///////////////////////////////////////////////////////////////
// Video Filters //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ReloadCustomVideoFilter()
{
	try
	{
		eval("customVideoFilter = function(rgba) { " + settings.ui2_preferredVideoFilter + " }");
		if (loadingFinished)
		{
			if (!isCamimgElementBusy)
				DrawToCanvas();
			showSuccessToast("Filter set");
		}
	}
	catch (ex) { showErrorToast(ex); }
}
function ApplyVideoFilter(context2d, canvas)
{
	if (canvas.width == 0)
		return;
	var imgData = context2d.getImageData(0, 0, canvas.width, canvas.height);
	var rgba = imgData.data;
	applyCustomVideoFilter(rgba);
	context2d.putImageData(imgData, 0, 0);
}
function applyCustomVideoFilter(rgba)
{
	if (customVideoFilter)
		try
		{
			customVideoFilter(rgba);
		}
		catch (ex)
		{
			showErrorToast(ex);
			customVideoFilter = null;
		}
}
var preservedCustomFilterUserInput = "";
var preservedCustomFilterUserInputToast = null;
function loadPredefinedFilter(filterName)
{
	var textarea = $("#optionDialog_option_ui2_preferredVideoFilter");
	preservedCustomFilterUserInput = textarea.val();
	settings.ui2_preferredVideoFilter = eval("predefined_filter_" + filterName);
	textarea.val(settings.ui2_preferredVideoFilter);
	ReloadCustomVideoFilter();
	dismissPreviousUndoToasts();
	showInfoToast('<div onclick="undoCustomVideoFilterChange(this)" class="customVideoFilterUndoToast">The Custom Video Filter script has been replaced. '
		+ 'Click this message to UNDO.</div>', 15000, true);
}
function dismissPreviousUndoToasts()
{
	$(".customVideoFilterUndoToast").parents(".toast").children(".toast-close-button").click();
}
function undoCustomVideoFilterChange(ele)
{
	$(ele).parents(".toast").children(".toast-close-button").click();
	var textarea = $("#optionDialog_option_ui2_preferredVideoFilter");
	settings.ui2_preferredVideoFilter = preservedCustomFilterUserInput;
	textarea.val(settings.ui2_preferredVideoFilter);
	ReloadCustomVideoFilter();
}
var predefined_filter_red1 = "// predefined_filter_red1\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
var predefined_filter_red2 = "// predefined_filter_red2\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	if (rgba[i] < rgba[i + 1])\n\
		rgba[i] = rgba[i + 1];\n\
	if (rgba[i] < rgba[i + 2])\n\
		rgba[i] = rgba[i + 2];\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
var predefined_filter_red3 = "// predefined_filter_red3\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i] = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
var predefined_filter_ghost = "// predefined_filter_ghost\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i + 3] = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;\n\
}";
var predefined_filter_invert = "// predefined_filter_invert\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i] = 255 - rgba[i];\n\
	rgba[i + 1] = 255 - rgba[i + 1];\n\
	rgba[i + 2] = 255 - rgba[i + 2];\n\
}";
var predefined_filter_invert_red3 = "// predefined_filter_invert_red3\n\
for (var i = 0; i < rgba.length; i += 4)\n\
{\n\
	rgba[i] = 255 - (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;\n\
	rgba[i + 1] = 0;\n\
	rgba[i + 2] = 0;\n\
}";
///////////////////////////////////////////////////////////////
// Image Digital Zoom / Mouse Handlers ////////////////////////
///////////////////////////////////////////////////////////////
var zoomHintTimeout = null;
var zoomHintIsVisible = false;
var digitalZoom = 0;
var zoomTable = [0, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 30, 35, 40, 45, 50];
var imageIsDragging = false;
var imageIsLargerThanAvailableSpace = false;
var mouseX = 0;
var mouseY = 0;
var imgDigitalZoomOffsetX = 0;
var imgDigitalZoomOffsetY = 0;
var previousImageDraw = new Object();
previousImageDraw.x = -1;
previousImageDraw.y = -1;
previousImageDraw.w = -1;
previousImageDraw.h = -1;
previousImageDraw.z = 10;

function ImgResized(isFromKeyboard)
{
	var imgAvailableWidth = $("#layoutbody").width();
	var imgAvailableHeight = $("#layoutbody").height();

	// Calculate new size based on zoom levels
	var imgForSizing = isFirstCameraImageLoaded ? currentlyLoadedImage : currentlyLoadingImage;
	var imgNativeDims = h264Player.isEnabled()
		? { w: imgForSizing.actualwidth, h: imgForSizing.actualheight }
		: { w: imgForSizing.fullwidth, h: imgForSizing.fullheight };
	var aspectRatio = imgNativeDims.w / imgNativeDims.h;
	var imgDrawWidth = imgNativeDims.w * (zoomTable[digitalZoom]);
	var imgDrawHeight = imgNativeDims.h * (zoomTable[digitalZoom]);
	if (imgDrawWidth == 0)
	{
		imgDrawWidth = imgAvailableWidth;
		imgDrawHeight = imgAvailableHeight;

		var newRatio = imgDrawWidth / imgDrawHeight;
		if (newRatio < aspectRatio)
			imgDrawHeight = imgDrawWidth / aspectRatio;
		else
			imgDrawWidth = imgDrawHeight * aspectRatio;
	}
	$("#camimg,#camimg_canvas").css("width", imgDrawWidth + "px");
	$("#camimg,#camimg_canvas").css("height", imgDrawHeight + "px");

	imageIsLargerThanAvailableSpace = imgDrawWidth > imgAvailableWidth || imgDrawHeight > imgAvailableHeight;

	if (previousImageDraw.z > -1 && previousImageDraw.z != digitalZoom)
	{
		// We just experienced a zoom change
		// Find the mouse position percentage relative to the center of the image at its old size
		var imgPos = $(camImgElementSelector).position();
		var layoutbodyOffset = $("#layoutbody").offset();
		var xPos = mouseX;
		var yPos = mouseY;
		if (isFromKeyboard)
		{
			xPos = layoutbodyOffset.left + ($("#layoutbody").outerWidth(true) / 2);
			yPos = layoutbodyOffset.top + ($("#layoutbody").outerHeight(true) / 2);
		}
		var mouseRelX = -0.5 + (parseFloat((xPos - layoutbodyOffset.left) - imgPos.left) / previousImageDraw.w);
		var mouseRelY = -0.5 + (parseFloat((yPos - layoutbodyOffset.top) - imgPos.top) / previousImageDraw.h);

		// Get the difference in image size
		var imgSizeDiffX = imgDrawWidth - previousImageDraw.w;
		var imgSizeDiffY = imgDrawHeight - previousImageDraw.h;
		// Modify the zoom offsets by % of difference
		imgDigitalZoomOffsetX -= mouseRelX * imgSizeDiffX;
		imgDigitalZoomOffsetY -= mouseRelY * imgSizeDiffY;
	}

	// Enforce digital panning limits
	var maxOffsetX = (imgDrawWidth - imgAvailableWidth) / 2;
	if (maxOffsetX < 0)
		imgDigitalZoomOffsetX = 0;
	else if (imgDigitalZoomOffsetX > maxOffsetX)
		imgDigitalZoomOffsetX = maxOffsetX;
	else if (imgDigitalZoomOffsetX < -maxOffsetX)
		imgDigitalZoomOffsetX = -maxOffsetX;

	var maxOffsetY = (imgDrawHeight - imgAvailableHeight) / 2;
	if (maxOffsetY < 0)
		imgDigitalZoomOffsetY = 0;
	else if (imgDigitalZoomOffsetY > maxOffsetY)
		imgDigitalZoomOffsetY = maxOffsetY;
	else if (imgDigitalZoomOffsetY < -maxOffsetY)
		imgDigitalZoomOffsetY = -maxOffsetY;

	// Calculate new image position
	var proposedX = (((imgAvailableWidth - imgDrawWidth) / 2) + imgDigitalZoomOffsetX);
	var proposedY = (((imgAvailableHeight - imgDrawHeight) / 2) + imgDigitalZoomOffsetY);

	$("#camimg,#camimg_canvas").css("left", proposedX + "px");
	$("#camimg,#camimg_canvas").css("top", proposedY + "px");

	// Store new image position for future calculations
	previousImageDraw.x = proposedX;
	previousImageDraw.x = proposedY;
	previousImageDraw.w = imgDrawWidth;
	previousImageDraw.h = imgDrawHeight;
	previousImageDraw.z = digitalZoom;

	UI2_CustomEvent.Invoke("ImageResized");
}
function DigitalZoomNow(deltaY, isFromKeyboard)
{
	if (deltaY < 0)
		digitalZoom -= 1;
	else if (deltaY > 0)
		digitalZoom += 1;
	if (digitalZoom < 0)
		digitalZoom = 0;
	else if (digitalZoom >= zoomTable.length)
		digitalZoom = zoomTable.length - 1;

	$("#zoomhint").stop(true, true);
	$("#zoomhint").show();
	zoomHintIsVisible = true;
	$("#zoomhint").html(digitalZoom == 0 ? "Fit" : (zoomTable[digitalZoom] + "x"))
	RepositionZoomHint(isFromKeyboard);
	if (zoomHintTimeout != null)
		clearTimeout(zoomHintTimeout);
	zoomHintTimeout = setTimeout(function ()
	{
		$("#zoomhint").fadeOut({
			done: function ()
			{
				zoomHintIsVisible = false;
			}
		})
	}, 200);

	ImgResized(isFromKeyboard);

	SetCamCellCursor();
}
$(function ()
{
	$('#layoutbody').mousewheel(function (e, delta, deltaX, deltaY)
	{
		if (settings.ui2_enableDigitalZoom != "1") // This setting is only regarding mouse wheel zoom.
			return;
		e.preventDefault();
		DigitalZoomNow(deltaY, false);
	});
	$('#layoutbody,#zoomhint').mousedown(function (e)
	{
		if (e.which == 1)
		{
			mouseX = e.pageX;
			mouseY = e.pageY;
			imageIsDragging = true;
			SetCamCellCursor();
			e.preventDefault();
		}
	});
	$(document).mouseup(function (e)
	{
		if (e.which == 1)
		{
			if (camImgClickState.mouseDown)
			{
				if (Math.abs(camImgClickState.mouseX - e.pageX) <= mouseMoveTolerance
					|| Math.abs(camImgClickState.mouseY - e.pageY) <= mouseMoveTolerance)
				{
					camImgClickState.mouseDown = false;
					ImgClick(e);
				}
			}
			imageIsDragging = false;
			SetCamCellCursor();

			mouseX = e.pageX;
			mouseY = e.pageY;
		}
	});
	$('#layoutbody').mouseleave(function (e)
	{
		camImgClickState.mouseDown = false;
		// The purpose of this commented code was to prevent mouse drag actions from taking effect once the pointer left the browser, 
		// but as of my latest tests, no modern browser has a problem with mouse dragging that continues outside the browser window.
		//
		//var ofst = $("#layoutbody").offset();
		//if (e.pageX < ofst.left || e.pageY < ofst.top || e.pageX >= ofst.left + $("#layoutbody").width() || e.pageY >= ofst.top + $("#layoutbody").height())
		//{
		//	imageIsDragging = false;
		//	isDraggingSeekbar = false;
		//	SetCamCellCursor();
		//}
		mouseX = e.pageX;
		mouseY = e.pageY;
	});
	$(document).mouseleave(function (e)
	{
		camImgClickState.mouseDown = false;
		imageIsDragging = false;
		isDraggingSeekbar = false;
		SetCamCellCursor();
	});
	$(document).on("mousemove touchmove", function (e)
	{
		if (typeof e.pageX == "undefined")
			e.pageX = e.originalEvent.touches[0].pageX;
		if (typeof e.pageY == "undefined")
			e.pageY = e.originalEvent.touches[0].pageY;

		if (camImgClickState.mouseDown)
		{
			if ((Math.abs(camImgClickState.mouseX - e.pageX) > mouseMoveTolerance
				|| Math.abs(camImgClickState.mouseY - e.pageY) > mouseMoveTolerance))
			{
				camImgClickState.mouseDown = false;
			}
			else
				return;
		}
		var requiresImgResize = false;
		if (imageIsDragging && imageIsLargerThanAvailableSpace)
		{
			imgDigitalZoomOffsetX += (e.pageX - mouseX);
			imgDigitalZoomOffsetY += (e.pageY - mouseY);
			requiresImgResize = true;
		}

		mouseX = e.pageX;
		mouseY = e.pageY;

		if (requiresImgResize)
			ImgResized(false);

		if (zoomHintIsVisible)
			RepositionZoomHint(false);

		HandleSeekbarMouseMove();

		PositionPlaybackControls();
	});
});
var mouseMoveTolerance = 5;
var camImgClickState = new Object();
camImgClickState.mouseDown = false;
camImgClickState.mouseX = 0;
camImgClickState.mouseY = 0;
function RegisterCamImgClickHandler()
{
	$('#layoutbody').mousedown(function (e)
	{
		camImgClickState.mouseDown = true;
		camImgClickState.mouseX = e.pageX;
		camImgClickState.mouseY = e.pageY;
	});
}
function RepositionZoomHint(isFromKeyboard)
{
	var xPos = mouseX;
	var yPos = mouseY;
	if (isFromKeyboard)
	{
		var layoutbodyOffset = $("#layoutbody").offset();
		xPos = layoutbodyOffset.left + ($("#layoutbody").outerWidth(true));
		yPos = layoutbodyOffset.top + ($("#layoutbody").outerHeight(true));
	}
	$("#zoomhint").css("left", (xPos - $("#zoomhint").outerWidth(true)) + "px").css("top", (yPos - $("#zoomhint").outerHeight(true)) + "px");
}
function SetCamCellCursor()
{
	var outerObjs = $('#layoutbody,#camimg,#camimg_canvas,#zoomhint');
	if (imageIsLargerThanAvailableSpace)
	{
		if (imageIsDragging)
		{
			outerObjs.removeClass("grabcursor");
			outerObjs.addClass("grabbingcursor");
		}
		else
		{
			outerObjs.removeClass("grabbingcursor");
			outerObjs.addClass("grabcursor");
		}
	}
	else
	{
		outerObjs.removeClass("grabcursor");
		outerObjs.removeClass("grabbingcursor");
		var innerObjs = $('#camimg,#camimg_canvas,#zoomhint');
		innerObjs.css("cursor", "default");
	}
}
///////////////////////////////////////////////////////////////
// Seek bar stuff /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var isDraggingSeekbar = false;
var currentSeekBarPositionRelative = 0.0;
var lastSeekBarMouseDownStarted = new Date().getTime() - 9999;
var lastSeekBarMouseDown = { X: -1000, Y: -1000 };
var lastSeekBarDoubleMouseDownStarted = new Date().getTime() - 9999;
$(function ()
{
	$("#playback_seekbar").on("mousedown touchstart", function (e)
	{
		if (e.which <= 1 && !currentlyLoadingImage.isLive && settings.ui2_clipPlaybackSeekBarEnabled == "1")
		{
			if (typeof e.pageX == "undefined")
			{
				e.pageX = e.originalEvent.touches[0].pageX;
				e.pageY = e.originalEvent.touches[0].pageY;
			}
			var thisTime = new Date().getTime();
			if (thisTime < lastSeekBarMouseDownStarted + doubleClickTime
				&& Math.abs(e.pageX - lastSeekBarMouseDown.X) < 20
				&& Math.abs(e.pageY - lastSeekBarMouseDown.Y) < 20)
			{
				lastSeekBarDoubleMouseDownStarted = lastSeekBarMouseDownStarted;
			}
			lastSeekBarMouseDownStarted = thisTime;
			lastSeekBarMouseDown.X = e.pageX;
			lastSeekBarMouseDown.Y = e.pageY;
			setMousePosVars(e);
			isDraggingSeekbar = true;
			HandleSeekbarMouseMove();
			return stopDefault(e);
		}
	});
	$(document).on("mouseup touchend touchcancel", function (e)
	{
		setMousePosVars(e);
		HandleSeekbarMouseMove();
		isDraggingSeekbar = false;
		if (new Date().getTime() < lastSeekBarDoubleMouseDownStarted + doubleClickTime)
			seekBarDblClick();
	});
});
function setMousePosVars(e)
{
	if (typeof e.pageX == "undefined" || typeof e.pageY == "undefined")
	{
		if (e.originalEvent.touches.length == 0)
			return;
		else
		{
			e.pageX = e.originalEvent.touches[0].pageX;
			e.pageY = e.originalEvent.touches[0].pageY;
		}
	}
	if (typeof e.pageX == "undefined" || typeof e.pageY == "undefined")
		return;
	mouseX = e.pageX;
	mouseY = e.pageY;
}
function HandleSeekbarMouseMove()
{
	if (isDraggingSeekbar)
	{
		Playback_Pause();
		var seekbarX = $("#playback_seekbar").offset().left;
		var seekbarW = $("#playback_seekbar").width();
		if (seekbarW < 1)
			seekbarW = 1;
		var newSeekHandlePos = mouseX - seekbarX;
		if (newSeekHandlePos < 0)
			newSeekHandlePos = 0;
		else if (newSeekHandlePos >= seekbarW)
			newSeekHandlePos = seekbarW;
		currentSeekBarPositionRelative = newSeekHandlePos / seekbarW;
		if (currentSeekBarPositionRelative < 0)
			currentSeekBarPositionRelative = 0;
		else if (currentSeekBarPositionRelative > 1)
			currentSeekBarPositionRelative = 1;
		$("#playback_seekbar_handle").css("left", newSeekHandlePos - 10 + "px");
		SetPlaybackPositionRelative(currentSeekBarPositionRelative);
		PositionPlaybackControls();
	}
}
function SetPlaybackPositionRelative(positionRelative)
{
	if (currentlyLoadingImage.msec <= 1)
		clipPlaybackPosition = 0;
	else
		clipPlaybackPosition = parseInt(positionRelative * (currentlyLoadingImage.msec - 1));
	if (clipPlaybackPosition < 0)
		clipPlaybackPosition = 0;
}
function SetSeekbarPositionByPlaybackTime(timeValue)
{
	if (settings.ui2_clipPlaybackSeekBarEnabled == "1")
	{
		if (currentlyLoadingImage.msec <= 1)
			currentSeekBarPositionRelative = 0;
		else
			currentSeekBarPositionRelative = parseFloat(timeValue / (currentlyLoadingImage.msec - 1));
		var seekbarW = $("#playback_seekbar").width();
		var newSeekHandlePos = currentSeekBarPositionRelative * seekbarW;
		$("#playback_seekbar_handle").css("left", newSeekHandlePos - 10 + "px");
		$("#playback_position").text(msToTime(timeValue));
		$("#playback_remaining").text("-" + msToTime(currentlyLoadingImage.msec - 1 - timeValue));
	}
}
function seekBarDblClick()
{
	Playback_Play();
}
///////////////////////////////////////////////////////////////
// Click-to-select ////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function ImgClick(event)
{
	if (!currentlyLoadingImage.isLive || hasOnlyOneCamera)
		return;
	var camData = GetCameraUnderMousePointer(event);
	if (camData != null)
	{
		ImgClick_Camera(camData);
	}
}
function ImgClick_Camera(camData)
{
	if (camData.optionValue == currentlyLoadedImage.id)
		camData = GetGroupCamera(currentlySelectedHomeGroupId);
	LoadLiveCamera(camData);
}
function GetCameraUnderMousePointer(event)
{
	// Find out which camera is under the mouse pointer, if any.
	mouseX = event.pageX;
	mouseY = event.pageY;

	var imgPos = $(camImgElementSelector).position();
	var layoutbodyOffset = $("#layoutbody").offset();
	var mouseRelX = parseFloat((mouseX - layoutbodyOffset.left) - imgPos.left) / previousImageDraw.w;
	var mouseRelY = parseFloat((mouseY - layoutbodyOffset.top) - imgPos.top) / previousImageDraw.h;
	var x = currentlyLoadedImage.fullwidth * mouseRelX;
	var y = currentlyLoadedImage.fullheight * mouseRelY;
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (currentlyLoadedImage.id == camData[i].optionValue)
		{
			if (typeof camData[i].group != "undefined")
			{
				for (var j = 0; j < camData[i].rects.length; j++)
				{
					if (x > camData[i].rects[j][0] && y > camData[i].rects[j][1] && x < camData[i].rects[j][2] && y < camData[i].rects[j][3])
						return GetCameraWithId(camData[i].group[j]);
				}
			}
			else
			{
				return camData[i];
			}
		}
	}
	return null;
}
function GetCameraWithId(cameraId)
{
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (cameraId == camData[i].optionValue)
			return camData[i];
	}
	return null;
}
function GetCameraName(cameraId)
{
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (cameraId == camData[i].optionValue)
			return camData[i].optionDisplay;
	}
	return cameraId;
}
function LoadLiveCamera(camData)
{
	currentlyLoadingCamera = camData;
	UpdateSelectedLiveCameraFields();
}
function LoadClipWithPath(clipPath, camId, msec)
{
	var camData = lastCameraListResponse.data;
	for (var i = 0; i < camData.length; i++)
	{
		if (camId == camData[i].optionValue)
		{
			currentlyLoadingCamera = camData[i];
			UpdateSelectedClipFields(clipPath, msec);
			Playback_Play();
			break;
		}
	}
}
var isFirstUpdateSelectedLiveCameraFields = true;
function UpdateSelectedLiveCameraFields()
{
	digitalZoom = 0;
	currentlyLoadingImage.id = currentlyLoadingCamera.optionValue;
	currentlyLoadingImage.fullwidth = currentlyLoadingCamera.width;
	currentlyLoadingImage.fullheight = currentlyLoadingCamera.height;
	currentlyLoadingImage.aspectratio = currentlyLoadingImage.fullwidth / currentlyLoadingImage.fullheight;
	currentlyLoadingImage.path = currentlyLoadingCamera.optionValue;
	currentlyLoadingImage.isLive = true;
	currentlyLoadingImage.ptz = currentlyLoadingCamera.ptz;
	currentlyLoadingImage.audio = currentlyLoadingCamera.audio;
	currentlyLoadingImage.isGroup = currentlyLoadingCamera.group ? true : false;
	clipPlaybackPosition = timeLastClipFrame = 0;
	if ($("#btnGoLive").is(":visible"))
	{
		$("#btnGoLive").hide();
		DisableGoLiveButtonFlashing();
		$("#btnGoLive").removeClass("flashing");
	}
	$("#playback_controls").hide();

	UpdatePtzControlDisplayState();
	audioStop();
	if (currentlyLoadingImage.audio)
	{
		$("#audio_icon").show();
		if (settings.ui2_audioAutoPlay == "1")
			audioPlay();
	}
	else
		$("#audio_icon").hide();

	$("#selectedCameraName").show();
	$("#selectedCameraName").text(CleanUpGroupName(currentlyLoadingCamera.optionDisplay));
	$("#clipsCameraName").show();
	if (settings.ui2_autoLoadClipList == "1" && !isFirstUpdateSelectedLiveCameraFields)
	{
		LoadClips(settings.ui2_preferredClipList, currentlyLoadingCamera.optionValue);
	}
	h264Player.Load(currentlyLoadingImage.id);
	if (!isFirstUpdateSelectedLiveCameraFields)
	{
		//RestartJpegDiffStream();
		GetNewImage();
	}
	isFirstUpdateSelectedLiveCameraFields = false;
}
var isFirstUpdateSelectedClipFields = true;
function UpdateSelectedClipFields(clipPath, msec)
{
	digitalZoom = 0;
	currentlyLoadingImage.id = currentlyLoadingCamera.optionValue;
	currentlyLoadingImage.fullwidth = currentlyLoadingCamera.width;
	currentlyLoadingImage.fullheight = currentlyLoadingCamera.height;
	currentlyLoadingImage.aspectratio = currentlyLoadingImage.fullwidth / currentlyLoadingImage.fullheight;
	currentlyLoadingImage.path = clipPath;
	currentlyLoadingImage.isLive = false;
	currentlyLoadingImage.ptz = false;
	currentlyLoadingImage.audio = false;
	currentlyLoadingImage.msec = parseInt(msec);
	currentlyLoadingImage.isGroup = false;
	timeLastClipFrame = new Date().getTime();
	clipPlaybackPosition = 0;
	if (!$("#btnGoLive").is(":visible"))
	{
		$("#btnGoLive").fadeIn();
		EnableGoLiveButtonFlashing();
		$("#btnGoLive").addClass("flashing");
	}
	$("#playback_controls").show();
	UpdatePtzControlDisplayState();
	audioStop();
	$("#clipsCameraName").hide();
	h264Player.Disable();
	if (!isFirstUpdateSelectedClipFields)
	{
		//RestartJpegDiffStream();
		GetNewImage();
	}
	isFirstUpdateSelectedClipFields = false;
}
function GetGroupCamera(groupId)
{
	for (var i = 0; i < lastCameraListResponse.data.length; i++)
	{
		if (CameraIsGroupOrCycle(lastCameraListResponse.data[i]))
		{
			if (lastCameraListResponse.data[i].optionValue == groupId)
			{
				return lastCameraListResponse.data[i];
			}
		}
	}
	return null;
}
function CameraIsGroup(cameraObj)
{
	return cameraObj.group;
}
function CameraIsGroupOrCycle(cameraObj)
{
	return cameraObj.group || cameraObj.optionValue.startsWith("@");
}
function CameraIsGroupOrCamera(cameraObj)
{
	return cameraObj.group || !cameraObj.optionValue.startsWith("@");
}
///////////////////////////////////////////////////////////////
// Camera Name Labels /////////////////////////////////////////
///////////////////////////////////////////////////////////////
$(function ()
{
	UI2_CustomEvent.AddListener("ImageResized", onui2_cameraLabelsChanged);
});
function onui2_cameraLabelsChanged()
{
	cameraNameLabels.show();
}
var cameraNameLabels = {};
cameraNameLabels.hide = function ()
{
	$(".cameraNameLabel").remove();
};
cameraNameLabels.show = function (isManualShow)
{
	cameraNameLabels.hide();
	if (!currentlyLoadedCamera || !isFirstCameraImageLoaded || settings.ui2_cameraLabels_enabled != "1")
		return;

	var showName = settings.ui2_cameraLabels_name == "1";
	var showShortName = settings.ui2_cameraLabels_shortname == "1";
	if (!showName && !showShortName)
		return;

	if (currentlyLoadedImage.isGroup)
	{
		var $body = $("#layoutbody");
		var imgNativeDims = h264Player.isEnabled()
			? { w: currentlyLoadedImage.actualwidth, h: currentlyLoadedImage.actualheight }
			: { w: currentlyLoadedImage.fullwidth, h: currentlyLoadedImage.fullheight };
		var scaleX = previousImageDraw.w / imgNativeDims.w;
		var scaleY = previousImageDraw.h / imgNativeDims.h;
		var yOffset = parseFloat(settings.ui2_cameraLabels_topOffset) * scaleY;

		// Calculate label font size
		var fontSizePt = parseFloat(settings.ui2_cameraLabels_fontSize);
		if (settings.ui2_cameraLabels_fontScaling == "1")
		{
			var zoomAmount = (scaleX + scaleY) / 2; // scaleX and scaleY are probably the same or very close anyway.
			fontSizePt *= zoomAmount;
			var minScaledFontSize = parseFloat(settings.ui2_cameraLabels_minimumFontSize);
			if (fontSizePt < minScaledFontSize)
				fontSizePt = minScaledFontSize;
		}

		var imgPos = $(camImgElementSelector).position();
		for (var i = 0; i < currentlyLoadedCamera.group.length; i++)
		{
			var cam = GetCameraWithId(currentlyLoadedCamera.group[i]);
			var rect = currentlyLoadedCamera.rects[i];

			// Calculate scaled/adjusted rectangle boundaries
			var adjX = rect[0] * scaleX;
			var adjY = rect[1] * scaleY;
			var adjW = (rect[2] - rect[0]) * scaleX;
			var adjBottom = rect[3] * scaleY;

			// Create and style labels.
			var $label = $('<div class="cameraNameLabel"></div>');
			if (showName && showShortName)
				$label.text(cam.optionDisplay + " (" + cam.optionValue + ")");
			else if (showName)
				$label.text(cam.optionDisplay);
			else
				$label.text(cam.optionValue);
			$label.css("width", adjW + "px");
			if (settings.ui2_cameraLabels_cameraColor == "1")
			{
				var colorHex = BlueIrisColorToCssColor(cam.color);
				$label.css("background-color", "#" + colorHex);
				$label.css("color", "#" + GetReadableTextColorHexForBackgroundColorHex(colorHex));
			}
			$label.css("font-size", fontSizePt + "pt");
			$label.css("left", (adjX + imgPos.left) + "px");
			$body.append($label);
			if (settings.ui2_cameraLabels_positionTop == "1")
				$label.css("top", (adjY + imgPos.top + yOffset) + "px");
			else
				$label.css("top", ((adjBottom + imgPos.top + yOffset) - $label.height()) + "px");
		}
	}
	else if (isManualShow)
	{
		showInfoToast("Camera name labels can only be shown on groups of cameras.");
	}
};
///////////////////////////////////////////////////////////////
// On-screen Toast Messages ///////////////////////////////////
///////////////////////////////////////////////////////////////
function showToastInternal(type, message, showTime, closeButton)
{
	if (typeof message == "object" && typeof message.stack == "string")
		message = message.stack;
	var overrideOptions = {};

	if (showTime)
		overrideOptions.timeOut = showTime;

	if (closeButton)
	{
		overrideOptions.closeButton = true;
		overrideOptions.tapToDismiss = false;
		overrideOptions.extendedTimeOut = 60000;
	}

	toastr[type](message, null, overrideOptions);

	try
	{
		console.log(type + " toast: " + message);
	}
	catch (ex) { }
}
function showSuccessToast(message, showTime, closeButton)
{
	showToastInternal('success', message, showTime, closeButton);
}
function showInfoToast(message, showTime, closeButton)
{
	showToastInternal('info', message, showTime, closeButton);
}
function showWarningToast(message, showTime, closeButton)
{
	showToastInternal('warning', message, showTime, closeButton);
}
function showErrorToast(message, showTime, closeButton)
{
	showToastInternal('error', message, showTime, closeButton);
}
$(function ()
{
	toastr.options = {
		"closeButton": false,
		"debug": false,
		"positionClass": "toast-bottom-right",
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "3000",
		"extendedTimeOut": "3000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	}
});

///////////////////////////////////////////////////////////////
// Context Menus //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var lastLiveContextMenuSelectedCamera = null;
var registerClipListContextMenu = function () { };
var registerHlsContextMenu = function () { };
var register_Camimg_Canvas_ContextMenu = function () { };
function LoadContextMenus()
{
	var optionLive =
		{
			alias: "cmroot_live", width: 150, items:
			[
				{ text: "<span id=\"contextMenuCameraName\">Camera Name</span>", icon: "", alias: "cameraname" }
				, { text: "Open HLS Stream", icon: "ui2/movie32.png", alias: "openhls", action: onLiveContextMenuAction }
				, { type: "splitLine" }
				, { text: "Trigger Now", icon: "ui2/lightning32.png", alias: "trigger", action: onLiveContextMenuAction }
				, { text: "<span title=\"Toggle Manual Recording\" id=\"manRecBtnLabel\">Toggle Recording</span>", icon: "ui2/record32.png", alias: "record", action: onLiveContextMenuAction }
				, { text: "<span title=\"Blue Iris will record a snapshot\">Record Snapshot</span>", icon: "ui2/camera32.png", alias: "snapshot", action: onLiveContextMenuAction }
				, { text: "Restart Camera", icon: "ui2/reset32.png", alias: "restart", action: onLiveContextMenuAction }
				, { type: "splitLine" }
				, { text: "<span id=\"contextMenuMaximize\">Maximize</span>", icon: "ui2/fullscreen32.png", alias: "maximize", action: onLiveContextMenuAction }
				, { type: "splitLine" }
				, { text: "Properties", icon: "ui2/show32.png", alias: "properties", action: onLiveContextMenuAction }
				/*,	{ text: "Group Three", icon: "sample-css/wi0062-16.gif", alias: "1-6", type: "group", width: 180, items:
				[
				{ text: "Item One", icon: "sample-css/wi0096-16.gif", alias: "4-1", action: menuAction },
				{ text: "Item Two", icon: "sample-css/wi0122-16.gif", alias: "4-2", action: menuAction }
				]
				}*/
			]
			, onContextMenu: function (e) { return onTriggerLiveContextMenu(e); }
			, onCancelContextMenu: onCancelContextMenu
			, onShow: onShowLiveContextMenu
		};
	var optionRecord =
		{
			alias: "cmroot_record", width: 150, items:
			[
				{ text: "Go Live", icon: "ui2/live32.png", alias: "golive", action: onRecordContextMenuAction }
			]
			, onContextMenu: onTriggerRecordContextMenu
			, onCancelContextMenu: onCancelContextMenu
		};
	var optionClipList =
		{
			alias: "cmroot_cliplist", width: 150, items:
			[
				{ text: "Flag", icon: "ui2/flag32.png", alias: "flag", action: onClipListContextMenuAction }
				, { text: '<div id="cmroot_cliplist_downloadbutton_findme" style="display:none"></div>Download<span id="cmroot_cliplist_downloadbutton_filesize"></span>', icon: "ui2/download_clip32.png", alias: "dlclip", action: onClipListContextMenuAction }
				, { text: 'Delete', icon: "ui2/delete_clip32.png", alias: "deleteclip", action: onClipListContextMenuAction }
			]
			, onContextMenu: onTriggerClipListContextMenu
			, onCancelContextMenu: onCancelContextMenu
		};
	$("#camimg").contextmenu(optionRecord);
	$("#camimg").contextmenu(optionLive);

	registerClipListContextMenu = function ($ele)
	{
		$ele.contextmenu(optionClipList);
	};

	var optionHeading =
		{
			alias: "cmroot_heading", width: 150, items:
			[
				{ text: "Log Out", icon: "ui2/door32.png", alias: "logout", action: onHeadingContextMenuAction }
			]
		};
	$("#logo").contextmenu(optionHeading);

	var optionHls =
		{
			alias: "cmroot_hls", width: 150, items:
			[
				{ text: "Open in New Tab", icon: "ui2/window32.png", alias: "newtab", action: onHlsContextMenuAction }
			]
			, clickType: "right"
		};

	registerHlsContextMenu = function ($ele)
	{
		$ele.contextmenu(optionHls);
	};

	register_Camimg_Canvas_ContextMenu = function ()
	{
		$("#camimg_canvas").contextmenu(optionRecord);
		$("#camimg_canvas").contextmenu(optionLive);
	};
	register_Camimg_Canvas_ContextMenu();
}
function onTriggerLiveContextMenu(e)
{
	if (currentlyLoadingImage.isLive)
	{
		camImgClickState.mouseDown = false;
		var camData = lastLiveContextMenuSelectedCamera = GetCameraUnderMousePointer(e);
		if (camData != null)
		{
			if (!CameraIsGroupOrCycle(camData))
				LoadDynamicManualRecordingButtonState(camData.optionValue);
			$("#contextMenuCameraName").text(CleanUpGroupName(camData.optionDisplay));
			$("#contextMenuCameraName").attr("title", "The buttons in this menu are specific to the camera: " + camData.optionDisplay);
			$("#contextMenuMaximize").text(camData.optionValue == currentlyLoadedImage.id ? "Back to Group" : "Maximize");
			return true; // Only show menu if we are over a camera!
		}
	}
	return false;
}
function onShowLiveContextMenu(menu)
{
	//	if (lastLiveContextMenuSelectedCamera.optionValue == currentlyLoadedImage.id)
	//		menu.applyrule(
	//		{
	//			name: "disable_cameraname_maximize",
	//			disable: true,
	//			items: ["cameraname", "maximize"]
	//		});
	//	else
	if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
	{
		menu.applyrule(
			{
				name: "disable_camera_buttons",
				disable: true,
				items: ["cameraname", "trigger", "record", "snapshot", "maximize", "restart", "properties"]
			});
	}
	else
	{
		menu.applyrule(
			{
				name: "disable_cameraname",
				disable: true,
				items: ["cameraname"]
			});
	}
}
function onTriggerRecordContextMenu(e)
{
	if (!currentlyLoadingImage.isLive)
	{
		camImgClickState.mouseDown = false;
		return true;
	}
	return false;
}
function onLiveContextMenuAction()
{
	switch (this.data.alias)
	{
		case "maximize":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("Function is unavailable.");
			else
				ImgClick_Camera(lastLiveContextMenuSelectedCamera);
			break;
		case "trigger":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot trigger cameras that are part of an auto-cycle.");
			else
				TriggerCamera(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		case "record":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot toggle recording of cameras that are part of an auto-cycle.");
			else
				ManualRecordCamera(lastLiveContextMenuSelectedCamera.optionValue, $("#manRecBtnLabel").attr("start"));
			break;
		case "snapshot":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot save a snapshot of cameras that are part of an auto-cycle.");
			else
				SaveSnapshotInBlueIris(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		case "restart":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot restart cameras that are part of an auto-cycle.");
			else
				ResetCamera(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		case "properties":
			if (CameraIsGroupOrCycle(lastLiveContextMenuSelectedCamera))
				showWarningToast("You cannot view properties of cameras that are part of an auto-cycle.");
			else
				ShowCameraProperties(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		case "openhls":
			OpenHLSPlayerDialog(lastLiveContextMenuSelectedCamera.optionValue);
			break;
		default:
			showErrorToast(this.data.alias + " is not implemented!");
			break;
	}
}
function onRecordContextMenuAction()
{
	switch (this.data.alias)
	{
		case "golive":
			goLive();
			break;
	}
}
function onHeadingContextMenuAction()
{
	switch (this.data.alias)
	{
		case "logout":
			logout();
			break;
		default:
			showErrorToast(this.data.alias + " is not implemented!");
			break;
	}
}
function onHlsContextMenuAction()
{
	switch (this.data.alias)
	{
		case "newtab":
			OpenJpegSuppressionDialog();
			CloseHLSPlayerDialog();
			window.open(remoteBaseURL + "livestream.htm?cam=" + encodeURIComponent(hlsPlayerLastCamId));
			break;
		default:
			showErrorToast(this.data.alias + " is not implemented!");
			break;
	}
}
function onTriggerClipListContextMenu(e)
{
	if (isLoggingOut)
		return false;
	var $clip = $(e.currentTarget);
	var clipPath = $clip.attr('path');
	if (clipPath == '')
	{
		showErrorToast("Script error. Unable to identify path of clicked clip.");
		return false;
	}
	var downloadButton = $("#cmroot_cliplist_downloadbutton_findme").parents(".b-m-item");
	if (downloadButton.parent().attr("id") == "cmroot_cliplist_downloadlink")
		downloadButton.parent().attr("href", remoteBaseURL + "clips/" + clipPath + GetRemoteSessionArg("?"));
	else
		downloadButton.wrap('<a id="cmroot_cliplist_downloadlink" style="display:block" href="' + remoteBaseURL + 'clips/' + clipPath + GetRemoteSessionArg("?") + '" target="_blank"></a>');
	var clipSize = $clip.attr("size");
	$("#cmroot_cliplist_downloadbutton_filesize").text(clipSize == "" ? "" : " (" + clipSize + ")");
	var extensionIdx = clipPath.indexOf(".");
	if (extensionIdx == -1)
		$("#cmroot_cliplist_downloadlink").removeAttr("download");
	else
	{
		var date = GetDateStr(new Date(parseInt($clip.attr("date"))));
		date = date.replace(/\//g, '-').replace(/:/g, '.');
		var fileName = $clip.attr("camid") + " " + date + clipPath.substr(extensionIdx);

		$("#cmroot_cliplist_downloadlink").attr("download", fileName);
	}
	return true;
}
function onClipListContextMenuAction(arg)
{
	if (!arg || !arg.context)
	{
		showErrorToast("Script error. Unable to identify clicked clip/alert.");
		return;
	}
	var clipTile = $(arg.context);
	var clipPath = clipTile.attr("path");
	if (clipPath == "")
	{
		showErrorToast("Script error. Unable to identify path of clicked clip/alert.");
		return;
	}
	switch (this.data.alias)
	{
		case "flag":
			// Find current flag state
			var clipData = clipListCache[clipTile.attr("camid")][clipPath];
			var camIsFlagged = (clipData.flags & 2) > 0;
			var newFlags = camIsFlagged ? clipData.flags ^ 2 : clipData.flags | 2;
			UpdateClipFlags(clipPath.replace(/\..*/g, ""), newFlags, function ()
			{
				// Success setting flag state
				clipData.flags = newFlags;
				if (camIsFlagged)
					HideClipFlag(clipTile);
				else
					ShowClipFlag(clipTile);
			});
			break;
		case "dlclip":
			return true;
		case "deleteclip":
			var confirmRequired;
			var isClip = false;
			if (settings.ui2_preferredClipList == "alertlist")
				confirmRequired = settings.ui2_alertDelete_requiresConfirmation == "1";
			else if (settings.ui2_preferredClipList == "cliplist")
			{
				isClip = true;
				confirmRequired = settings.ui2_clipDelete_requiresConfirmation == "1";
			}
			else
			{
				showErrorToast("A logic error has occurred. Please try loading the clip or alert list again.");
				return;
			}

			if (confirmRequired)
			{
				var clipClone = CloneAndStripIdAttributes(clipTile);
				clipClone.css("position", "static");
				clipClone.css("display", "inline-block");
				var questionDiv = $("<div>Are you sure you want to delete this " + (isClip ? "clip" : "alert") + "?</div>");
				questionDiv.append("<br/><br/>").append(clipClone).append("<br/><br/>");

				AskYesNo(questionDiv, function ()
				{
					DeleteAlert(clipPath, isClip, function ()
					{
						LoadClips(null, 'preserve_current_clipgroup');
					});
				});
			}
			else
			{
				DeleteAlert(clipPath, isClip, function ()
				{
					LoadClips(null, 'preserve_current_clipgroup');
				});
			}
			break;
	}
}
function onCancelContextMenu()
{
	//camImgClickState.mouseDown = false;
}
///////////////////////////////////////////////////////////////
// Options Dialog /////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var optionDialogModal = null;
function openOptionsDialog(category)
{
	optionDialog_Close();
	var $optionsDialog = $("#optionsDialog");
	$optionsDialog.remove();
	$("body").append('<div id="optionsDialog" style="display: none"></div>');
	$optionsDialog = $("#optionsDialog");
	for (var i = 0; i < defaultSettings.length; i++)
	{
		var s = defaultSettings[i];
		if (s.preLabel)
		{
			if (typeof s.category == "undefined")
			{
				s.category = "Uncategorized";
				if (!OptionsCategoryExists(s.category))
					settingsCategoryList.push(s.category);
			}
			if (!OptionsCategoryExists(s.category))
			{
				showWarningToast("Category " + s.category + " does not exist in the category list!");
				settingsCategoryList.push(s.category);
			}
		}
	}
	var categoryLinks = new Array();
	for (var i = 0; i < settingsCategoryList.length; i++)
	{
		if (settingsCategoryList[i] == category)
			categoryLinks.push('<span style="text-decoration: underline">' + settingsCategoryList[i] + '</span>');
		else
			categoryLinks.push('<a href="javascript:openOptionsDialog(\'' + settingsCategoryList[i] + '\')">' + settingsCategoryList[i] + '</a>');
	}
	var heading = '<div class="optionsDialogHeading">UI2 Configuration</div>'
		+ '<div class="categoryLinks">' + categoryLinks.join(" | ") + '</div>';

	$optionsDialog.append(heading);

	if (category)
	{
		var styleCounter = 0;
		for (var i = 0; i < defaultSettings.length; i++)
		{
			var s = defaultSettings[i];
			if (s.preLabel && s.category == category && (typeof s.displayCondition != "function" || s.displayCondition()))
			{
				var markup = '<div style="' + (++styleCounter % 2 == 1 ? 'background-color: #505050;' : 'background-color: #707070;') + '">';

				if (s.inputType == "hintonly")
				{
					if (s.hint)
						markup += '<div class="hintbox inlineblock" style="width: 100%;">' + s.hint + '</div>';
					markup += '<div style="clear:both;width:0px;height:0px;padding:0px;"></div></div>';
					$optionsDialog.append(markup);
				}
				else
				{
					markup += '<div class="optionbox inlineblock">' + s.preLabel;
					if (s.inputType == "textarea")
						markup += '<br/><textarea style="min-width:98%;max-width:98%;height:200px;"';
					else
						markup += ' <input type="' + (s.inputType ? s.inputType : "text") + '"';
					markup += ' id="optionDialog_option_' + s.key + '" onchange="optionDialog_OptionChanged(\'' + s.key + '\')" />';
					if (s.postLabel)
						markup += s.postLabel;
					markup += '</div>';

					if (s.hint)
						markup += '<div class="hintbox inlineblock">' + s.hint + '</div>';
					markup += '<div style="clear:both;width:0px;height:0px;padding:0px;"></div></div>';
					$optionsDialog.append(markup);

					var $input = $("#optionDialog_option_" + s.key);
					var currentValue = settings[s.key];
					if ($input.get(0).tagName.toLowerCase() == "textarea")
					{
						$input.val(currentValue);
						$input.on('keydown', TextAreaKeyHandler);
					}
					else if ($input.attr('type') == "checkbox")
						$input.prop("checked", currentValue == "1");
					else if (s.hotkey)
					{
						$input.attr("hotkeyId", s.key);
						$input.bind("keydown", HandleHotkeyChange);
						var parts = currentValue.split("|");
						if (parts.length != 5)
							$input.val("unset");
						else
							$input.val((parts[0] == "1" ? "CTRL + " : "")
								+ (parts[1] == "1" ? "ALT + " : "")
								+ (parts[2] == "1" ? "SHIFT + " : "")
								+ parts[4]);
					}
					else
						$input.val(currentValue);
					if (typeof s.minValue != "undefined")
						$input.attr("min", s.minValue);
					if (typeof s.maxValue != "undefined")
						$input.attr("max", s.maxValue);
					if (typeof s.stepSize != "undefined")
						$input.attr("step", s.stepSize);
					if (s.inputWidth)
						$input.css("width", s.inputWidth + "px");

					if (s.onchange)
						$input.bind("change", s.onchange);
				}
			}
		}
	}
	else
	{
		$optionsDialog.append("<div>Please select a category above.</div>");
	}
	optionDialogModal = $optionsDialog.modal({ removeElementOnClose: true });
}
function optionDialog_Close()
{
	if (optionDialogModal != null)
	{
		optionDialogModal.close();
		optionDialogModal = null;
	}
}
function OptionsCategoryExists(category)
{
	for (var i = 0; i < settingsCategoryList.length; i++)
		if (category == settingsCategoryList[i])
			return true;
	return false;
}
function optionDialog_OptionChanged(optionKey)
{
	var $input = $("#optionDialog_option_" + optionKey);
	var newValue;
	if ($input.get(0).tagName.toLowerCase() == "textarea")
		newValue = $input.val();
	else if ($input.attr('type') == "checkbox")
		newValue = $input.is(":checked") ? "1" : "0";
	else
		newValue = $input.val();

	var min = $input.attr("min");
	if (min)
	{
		if (parseInt(min) > parseInt(newValue))
		{
			showWarningToast("Value " + parseInt(newValue) + " is smaller than the minimum allowed value of " + parseInt(min));
			newValue = parseInt(min);
		}
	}
	var max = $input.attr("max");
	if (max)
	{
		if (parseInt(max) < parseInt(newValue))
		{
			showWarningToast("Value " + parseInt(newValue) + " is larger than the maximum allowed value of " + parseInt(max));
			newValue = parseInt(max);
		}
	}

	settings[optionKey] = newValue;
}
function onui2_showSystemNameChanged()
{
	if (settings.ui2_showSystemName == "1")
	{
		if ($("#system_name").text().length <= 9)
			$("#system_name").addClass("bigtext");
		else
			$("#system_name").removeClass("bigtext");
		$("#system_name").show();
		$("#fallback_logo").hide();
	}
	else
	{
		$("#system_name").hide();
		$("#fallback_logo").show();
	}
}
function onui2_showStoplightChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showStoplight", "#stoplight");
}
function onui2_enableStoplightButtonChanged()
{
	if (settings.ui2_enableStoplightButton == "1")
		$("#stoplight").removeClass("disabled");
	else
		$("#stoplight").addClass("disabled");
}
function onui2_showCpuMemChanged()
{
	if (settings.ui2_showCpuMem == "1")
		$("#cpumem").show();
	else
		$("#cpumem").hide();
}
function onui2_showProfileChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showProfile", "#profile_wrapper,#schedule_lock_wrapper");
}
function onui2_enableProfileButtonsChanged()
{
	if (settings.ui2_enableProfileButtons == "1")
	{
		$("#schedule_lock_button,.profilebtn").removeClass("disabled");
	}
	else
	{
		$("#schedule_lock_button,.profilebtn").addClass("disabled");
	}
}
function onui2_showScheduleChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showSchedule", "#schedule_wrapper");
}
function onui2_enableScheduleButtonChanged()
{
}
function onui2_showDiskInfoChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showDiskInfo", "#diskinfo");
}
function onui2_diskInfoWidthChanged()
{
	$("#diskinfo").css("width", parseInt(settings.ui2_diskInfoWidth) + "px");
}
function onui2_enableFrameRateCounterChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_enableFrameRateCounter", "#fpsCounter");
}
function onui2_showSaveSnapshotButtonChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showSaveSnapshotButton", "#save_snapshot_wrapper");
}
function onui2_showHLSButtonChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showHLSButton", "#open_hls_wrapper");
}
function onui2_thumbnailLoadingThreadsChanged()
{
	RestartImageQueue();
}
function onbi_rememberMeChanged()
{
	if (settings.bi_rememberMe == "1")
	{
		settings.bi_username = Base64.encode($("#txtUserName").val());
		settings.bi_password = Base64.encode($("#txtPassword").val());
	}
	else
		settings.bi_username = settings.bi_password = "";
}
function onui2_showQualityButtonChanged()
{
	ShowHideBasedOnCheckboxEnabledSetting("ui2_showQualityButton", "#quality");
}
function onui2_clipPlaybackSeekBarEnabledChanged()
{
	if (settings.ui2_clipPlaybackSeekBarEnabled == "0")
		$("#playback_position,#playback_remaining").text("");
}
function onui2_doAutoUpdateCheckChanged()
{
	if (settings.ui2_doAutoUpdateCheck == "1")
	{
		CheckForUpdates_Automatic();
	}
}
function onui2_enableCanvasDrawingChanged()
{
	SetCanvasVisibility();
	h264Player.Reinitialize();
}
function SetCanvasVisibility()
{
	if (settings.ui2_enableCanvasDrawing == "1")
	{
		camImgElementSelector = "#camimg_canvas";
		$("#camimg").hide();
		$("#camimg_canvas").show();
	}
	else
	{
		camImgElementSelector = "#camimg";
		$("#camimg_canvas").hide();
		$("#camimg").show();
	}
}
function onui2_h264DecodeInWorkerChanged()
{
	h264Player.Reinitialize();
}
function onui2_enableVideoFilterChanged()
{
	h264Player.Reinitialize();
	if (!isCamimgElementBusy && !h264Player.isEnabled())
		DrawToCanvas();
}
function onui2_preferredVideoFilterChanged()
{
	ReloadCustomVideoFilter();
}
function UpdatePtzControlDisplayState()
{
	if (currentlyLoadingImage.ptz)
		LoadPtzPresetThumbs();
	onui2_showPtzArrowsChanged();
	onui2_showPtzZoomChanged();
	onui2_showPtzFocusChanged();
	onui2_showPtzPresetsGroup1Changed();
	onui2_showPtzPresetsGroup2Changed();
}
function onui2_showPtzArrowsChanged()
{
	ShowHideBasedOnPtzStateAndCheckboxEnabledSetting("ui2_showPtzArrows", "#ptz_pt_wrapper");
}
function onui2_showPtzZoomChanged()
{
	ShowHideBasedOnPtzStateAndCheckboxEnabledSetting("ui2_showPtzZoom", "#ptz_z_wrapper");
}
function onui2_showPtzFocusChanged()
{
	ShowHideBasedOnPtzStateAndCheckboxEnabledSetting("ui2_showPtzFocus", "#ptz_f_wrapper");
}
function onui2_showPtzPresetsGroup1Changed()
{
	ShowHideBasedOnPtzStateAndCheckboxEnabledSetting("ui2_showPtzPresetsGroup1", "#ptz_presets_1_wrapper");
}
function onui2_showPtzPresetsGroup2Changed()
{
	ShowHideBasedOnPtzStateAndCheckboxEnabledSetting("ui2_showPtzPresetsGroup2", "#ptz_presets_2_wrapper");
}
function ShowHideBasedOnCheckboxEnabledSetting(settingsKey, objectSelector)
{
	if (settings.getItem(settingsKey) == "1")
		$(objectSelector).show();
	else
		$(objectSelector).hide();
}
function ShowHideBasedOnPtzStateAndCheckboxEnabledSetting(settingsKey, objectSelector)
{
	if (currentlyLoadingImage.ptz && settings.getItem(settingsKey) == "1")
		$(objectSelector).show();
	else
		$(objectSelector).hide();
}
///////////////////////////////////////////////////////////////
// About Dialog ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function openAboutDialog()
{
	$("#aboutDialog").modal({ maxWidth: 550, maxHeight: 600 });
}
///////////////////////////////////////////////////////////////
// Login Dialog ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var loginModal = null;
function openLoginDialog()
{
	if (settings.bi_rememberMe == "1")
	{
		$("#txtUserName").val(Base64.decode(settings.bi_username));
		$("#txtPassword").val(Base64.decode(settings.bi_password));
		$("#cbRememberMe").prop("checked", true);
	}
	else
		$("#cbRememberMe").prop("checked", false);
	loginModal = $("#loginDialog").modal({ maxWidth: 500, maxHeight: 300 });
}
function closeLoginDialog()
{
	if (loginModal != null)
	{
		loginModal.close();
		loginModal = null;
	}
}
///////////////////////////////////////////////////////////////
// Server Selection Dialog ////////////////////////////////////
///////////////////////////////////////////////////////////////
var _cached_serverList = null;
var serverSelectionDialogModal = null;
var editExternalServerDialogModal = null;
var lastServerSelectionDialogOnClose = null;
function GetServerList()
{
	if (_cached_serverList == null)
	{
		if (typeof GetLocalStorage().ui2_server_selection_list == "undefined" || GetLocalStorage().ui2_server_selection_list == null || GetLocalStorage().ui2_server_selection_list == "")
			_cached_serverList = new Array();
		else
			_cached_serverList = JSON.parse(GetLocalStorage().ui2_server_selection_list);
	}
	return _cached_serverList;
}
function ReloadServerSelectionDialog()
{
	ShowServerSelectionDialog(lastServerSelectionDialogOnClose);
}
function ShowServerSelectionDialog(onClose)
{
	CloseServerSelectionDialog(true);
	if (typeof (Storage) == "undefined")
	{
		$('<div id="localStorageUnsupported" style="text-align:center;font-size:1.25em;margin-top:20px;">'
			+ 'Your browser does not support Local storage. Please upgrade to a modern web browser.'
			+ '</div>').modal({ removeElementOnClose: true });
		return;
	}

	if (typeof onClose == "undefined")
		onClose = null;
	lastServerSelectionDialogOnClose = onClose;

	var linkToLocalServer = location.protocol + '//' + location.host + location.pathname;

	var isForcedStart = (!loadingFinished && showServerListAtStartup);

	var $serverSelectionDialog = $('<div id="serverSelectionDialog">'
		+ '<div style="margin: 10px 0px 10px 0px; width: 100%; text-align: center; font-size: 1.5em;">Blue Iris Server Selection</div>'
		+ '<div><table class="bordertable selectable" style="width:100%;"><thead>'
		+ '<tr>'
		+ '<th></th>'
		+ '<th>Server Name</th>'
		+ '<th>Host/IP Address</th>'
		+ '<th>User Name</th>'
		+ '<th title="Links include the server name with spaces URL encoded as %20">Link</th>'
		+ '<th>Edit</th>'
		+ '</tr>'
		+ '</thead><tbody>'
		+ '</tbody></table></div>'
		+ '<div style="margin-top: 20px; width: 100%; text-align: center;"><input type="button" class="button" style="font-size:1.25em;" value="Add New Server" onclick="AddNewExternalServer()" />'
		+ ' &nbsp; &nbsp; <input type="button" class="button" style="font-size:1.25em;" value="Remove Selected" onclick="RemoveSelectedExternalServers()" /></div>'
		+ '<div class="selectable">'
		+ '<div style="margin: 30px;">Points of interest:</br><ul>'
		+ '<li>This server list is stored in your browser, and not shared with anyone else.</li>'
		+ '<li>A unique copy of all settings are kept for each server.</li>'
		+ '<li>The server list always appears on startup when you use this URL: <a href="' + linkToLocalServer + '?serverlist=1">' + linkToLocalServer + '?serverlist=1</a></li>'
		+ '<li>Some or all features may fail if the remote server is running an incompatible Blue Iris version.</li>'
		+ (isForcedStart ? '<li style="color:#FFFF00;">If you close this dialog, the highlighted server will open.</li>' : '')
		+ '</ul></div>'
		+ '<div style="margin: 30px">Known issues:</br><ul>'
		+ '<li>When downloading snapshots and clips, UI2 cannot choose what the files will be named.</li>'
		+ '</ul></div>'
		+ '</div>' // Closes selectable
		+ '</div>'); // Closes serverSelectionDialog

	var linkToLocalServerCell;
	var localServerNameCell;
	var localStoredServerName = GetLocalStorage().ui2_localServerName;
	if (localStoredServerName == "%%SYSNAME%%")
		localStoredServerName = "Server Selector";
	if (isUsingRemoteServer || isForcedStart)
	{
		linkToLocalServerCell = '<a href="' + linkToLocalServer + '">' + linkToLocalServer + '</a>';
		localServerNameCell = '<a href="' + linkToLocalServer + '">' + htmlEncode(localStoredServerName) + '</a>';
	}
	else
	{
		linkToLocalServerCell = linkToLocalServer;
		localServerNameCell = htmlEncode(localStoredServerName);
	}
	// Add the local server to the table.
	$serverSelectionDialog.find("tbody").append('<tr' + (isUsingRemoteServer ? '' : ' class="currentServer"') + '>'
		+ '<td>&nbsp;&nbsp;</td>'
		+ '<td>' + localServerNameCell + '</td>'
		+ '<td>' + location.host + '</td>'
		+ '<td></td>'
		+ '<td>' + linkToLocalServerCell + '</td>'
		+ '<td>N/A</td>'
		+ '</tr>');

	// Add external servers to the table.
	var serverList = GetServerList();
	for (var i = 0; i < serverList.length; i++)
	{
		var server = serverList[i];
		var linkToServer = location.protocol + '//' + location.host + location.pathname + '?server=' + encodeURIComponent(server.name);
		var linkCell;
		var nameCell;
		isCurrentServer = server.name.toLowerCase() == remoteServerName.toLowerCase();
		if (isCurrentServer && !isForcedStart)
		{
			linkCell = linkToServer;
			nameCell = server.name;
		}
		else
		{
			linkCell = '<a href="' + linkToServer + '">' + linkToServer + '</a>';
			nameCell = '<a href="' + linkToServer + '">' + server.name + '</a>';
		}
		$serverSelectionDialog.find("tbody").append('<tr' + (isCurrentServer ? ' class="currentServer"' : '') + '>'
			+ '<td><input type="checkbox" class="externalServerSelector" myIndex="' + i + '" value="" /></td>'
			+ '<td>' + nameCell + '</td>'
			+ '<td>' + server.host + '</td>'
			+ '<td>' + Base64.decode(server.user) + '</td>'
			+ '<td>' + linkCell + '</td>'
			+ '<td><input type="button" class="button" value="EDIT" onclick="EditExternalServer(' + i + ')" /></td>'
			+ '</tr>');
	}
	var modalArgs = { removeElementOnClose: true, onClosing: onClose };
	if (isForcedStart)
		modalArgs.overlayOpacity = 1;
	serverSelectionDialogModal = $serverSelectionDialog.modal(modalArgs);
}
function CloseServerSelectionDialog(suppressCallback)
{
	if (serverSelectionDialogModal != null)
		if (serverSelectionDialogModal.close(suppressCallback))
			serverSelectionDialogModal = null;
}
function SaveServerList()
{
	GetLocalStorage().ui2_server_selection_list = JSON.stringify(GetServerList());
}
function GetServerWithName(serverName)
{
	var serverList = GetServerList();
	for (var i = 0; i < serverList.length; i++)
		if (serverList[i].name.toLowerCase() == serverName.toLowerCase())
			return serverList[i];
}
function AddNewExternalServer()
{
	var serverList = GetServerList();
	serverList.push({
		name: GetUniqueServerName(),
		host: location.host,
		user: "",
		pass: ""
	});
	SaveServerList(serverList);
	EditExternalServer(serverList.length - 1);
}
function RemoveSelectedExternalServers()
{
	var numDeleted = 0;
	var serverList = GetServerList();
	for (var i = serverList.length - 1; i >= 0; i--)
	{
		if ($("#serverSelectionDialog").find('input[type="checkbox"][myIndex="' + i + '"]:checked').length > 0)
		{
			serverList.splice(i, 1);
			numDeleted++;
		}
	}
	SaveServerList();
	ReloadServerSelectionDialog();
}
function EditExternalServer(i)
{
	try
	{
		var server = GetServerList()[i];
		var $serverSelectionDialog = $('<div id="editExternalServerDialog">'
			+ '<div style="margin: 10px 0px 10px 0px; width: 100%; text-align: center; font-size: 1.5em;">Edit Server</div>'
			+ '<div>'
			+ 'Server Name:<br/><input varname="name" id="txtExternalServer_name" type="text" value="' + server.name + '" onchange="EditExternalServerInputChanged(this, ' + i + ')" />'
			+ ' <span style="font-style:italic;">Max 16 characters, alphanumeric, must be unique</span>'
			+ '<br/><span style="font-style:italic;">UI Settings for the server are tied to this name. If the name is changed, the settings will not carry over.</span>'
			+ '</div>'
			+ '<div>'
			+ 'Host/IP address and port number:<br/><input varname="host" type="text" value="' + server.host + '" onchange="EditExternalServerInputChanged(this, ' + i + ')" />'
			+ ' <span style="font-style:italic;">Examples: "myserver.example.com:81" or "192.168.0.2"</span>'
			+ '</div>'
			+ '<div>'
			+ 'User Name:<br/><input varname="user" type="text" value="' + Base64.decode(server.user) + '" onchange="EditExternalServerInputChanged(this, ' + i + ')" />'
			+ ' <span style="font-style:italic;">Leave blank if unneeded</span>'
			+ '</div>'
			+ '<div>'
			+ 'Password:<br/><input varname="pass" type="password" value="' + Base64.decode(server.pass) + '" onchange="EditExternalServerInputChanged(this, ' + i + ')" />'
			+ ' <span style="font-style:italic;">Leave blank if unneeded</span>'
			+ '</div>'
			+ '<div>'
			+ '<input type="button" class="simpleTextButton btnGreen" value="DONE" onclick="CloseEditExternalServerDialog()" />'
			+ '</div>'
			+ '</div>');

		editExternalServerDialogModal = $serverSelectionDialog.modal(
			{
				removeElementOnClose: true,
				onClosing: function ()
				{
					editExternalServerDialogModal = null;
					if (ValidateExternalServerInput("name", $("#txtExternalServer_name").val(), i))
						server.name = $("#txtExternalServer_name").val();
					else
					{
						var invalidName = $("#txtExternalServer_name").val();
						server.name = GetUniqueServerName();
						$("#txtExternalServer_name").val(server.name);
						$("#txtExternalServer_name").removeClass("inputinvalid");
						showWarningToast("The server name " + htmlEncode(invalidName) + " did not pass validation."
							+ "<br/>The server name was changed to " + htmlEncode(server.name), 10000);
						return true;
					}
					server.host = $("#editExternalServerDialog").find('input[type="text"][varname="host"]').val();
					server.user = Base64.encode($("#editExternalServerDialog").find('input[type="text"][varname="user"]').val());
					server.pass = Base64.encode($("#editExternalServerDialog").find('input[type="password"][varname="pass"]').val());
					SaveServerList();
					ReloadServerSelectionDialog();
				}
			});
	}
	catch (ex) { showErrorToast(ex, 10000); }
}
function CloseEditExternalServerDialog()
{
	if (editExternalServerDialogModal != null)
		if (editExternalServerDialogModal.close())
			editExternalServerDialogModal = null;
}
function EditExternalServerInputChanged(self, index)
{
	var $self = $(self);
	var varname = $self.attr('varname');
	var val = $self.val();
	if (ValidateExternalServerInput(varname, val, index))
		$self.removeClass("inputinvalid");
	else
		$self.addClass("inputinvalid");
}
function ValidateRemoteServerNameSimpleRules(val)
{
	if (val.length == 0)
		return false;
	if (val.length > 16)
		return false;
	for (var i = 0; i < val.length; i++)
	{
		var c = val.charAt(i);
		if ((c < "a" || c > "z") && (c < "A" || c > "Z") && (c < "0" || c > "9") && c != " ")
			return false;
	}
	return true;
}
function ValidateExternalServerInput(varname, val, index)
{
	if (varname == "name")
	{
		if (!ValidateRemoteServerNameSimpleRules(val))
			return false;
		var serverList = GetServerList();
		for (var i = 0; i < serverList.length; i++)
			if (i != index && val.toLowerCase() == serverList[i].name.toLowerCase())
				return false;
		return true;
	}
	else if (varname == "host")
		return true;
	else if (varname == "user")
		return true;
	else if (varname == "pass")
		return true;
	return false;
}
function GetUniqueServerName(num)
{
	if (typeof num == "undefined" || num == null)
		num = 1;
	var name = "Server " + num;
	var serverList = GetServerList();
	for (var i = 0; i < serverList.length; i++)
		if (name.toLowerCase() == serverList[i].name.toLowerCase())
			return GetUniqueServerName(num + 1);
	return name;
}
function SaveLocalServerName(name)
{
	if (name != "")
		GetLocalStorage().ui2_localServerName = name;
}
//////////////////////////////////////////////////////////////////////
// GoLive Button Flashing ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
var btnGoLiveFlashingEnabled = false;
function EnableGoLiveButtonFlashing()
{
	btnGoLiveFlashingEnabled = true;
	DoGoLiveButtonFlash();
}
function DoGoLiveButtonFlash()
{
	if (!btnGoLiveFlashingEnabled)
		return;
	setTimeout(function ()
	{
		$("#btnGoLive").css("background-color", "#3A3A3A");
		setTimeout(function ()
		{
			$("#btnGoLive").css("background-color", "#666666");
			DoGoLiveButtonFlash();
		}, 1000);
	}, 1000);
}
function DisableGoLiveButtonFlashing()
{
	btnGoLiveFlashingEnabled = false;
}
//////////////////////////////////////////////////////////////////////
// Hotkeys ///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
var currentlyDownKeys = {};
function EnableHotkeys()
{
	$(document).keydown(function (e)
	{
		var charCode = e.which ? e.which : event.keyCode;
		if (currentlyDownKeys[charCode])
			return;
		currentlyDownKeys[charCode] = true;
		var charCode = e.which ? e.which : event.keyCode;
		var retVal = true;
		if (settings.ui2_enableHotkeys == "1" && $(".ui2modal").length == 0)
		{
			for (var i = 0; i < defaultSettings.length; i++)
			{
				var s = defaultSettings[i];
				if (s.hotkey)
				{
					var parts = settings[s.key].split("|");
					if (parts.length == 5)
					{
						var charCode = e.which ? e.which : event.keyCode
						if ((e.ctrlKey ? "1" : "0") == parts[0]
							&& (e.altKey ? "1" : "0") == parts[1]
							&& (e.shiftKey ? "1" : "0") == parts[2]
							&& (charCode == parts[3]))
						{
							s.hotkeyAction();
							retVal = false;
						}
					}
				}
			}
		}
		if (!retVal)
			return retVal;
	});
	$(document).keyup(function (e)
	{
		var charCode = e.which ? e.which : event.keyCode;
		currentlyDownKeys[charCode] = false;
		var retVal = true;
		if (settings.ui2_enableHotkeys == "1" && $(".ui2modal").length == 0)
		{
			for (var i = 0; i < defaultSettings.length; i++)
			{
				var s = defaultSettings[i];
				if (s.hotkey && typeof s.hotkeyUpAction == "function")
				{
					var parts = settings[s.key].split("|");
					if (parts.length == 5)
					{
						var charCode = e.which ? e.which : event.keyCode
						if (charCode == parts[3])
						{
							s.hotkeyUpAction();
							retVal = false;
						}
					}
				}
			}
		}
		if (!retVal)
			return retVal;
	});
}
function HandleHotkeyChange(e)
{
	var textBox = $(e.target);
	var charCode = e.which ? e.which : event.keyCode
	var modifiers = "";

	if (e.ctrlKey)
		modifiers += "CTRL + ";
	if (e.altKey)
		modifiers += "ALT + ";
	if (e.shiftKey)
		modifiers += "SHIFT + ";

	var keyName = String.fromCharCode(charCode);

	if (charCode == 8) keyName = "backspace"; //  backspace
	else if (charCode == 9) keyName = "tab"; //  tab
	else if (charCode == 13) keyName = "enter"; //  enter
	else if (charCode == 16) keyName = ""; //  shift
	else if (charCode == 17) keyName = ""; //  ctrl
	else if (charCode == 18) keyName = ""; //  alt
	else if (charCode == 19) keyName = "pause/break"; //  pause/break
	else if (charCode == 20) keyName = "caps lock"; //  caps lock
	else if (charCode == 27) keyName = "escape"; //  escape
	else if (charCode == 32) keyName = "space"; // space         
	else if (charCode == 33) keyName = "page up"; // page up, to avoid displaying alternate character and confusing people	         
	else if (charCode == 34) keyName = "page down"; // page down
	else if (charCode == 35) keyName = "end"; // end
	else if (charCode == 36) keyName = "home"; // home
	else if (charCode == 37) keyName = "left arrow"; // left arrow
	else if (charCode == 38) keyName = "up arrow"; // up arrow
	else if (charCode == 39) keyName = "right arrow"; // right arrow
	else if (charCode == 40) keyName = "down arrow"; // down arrow
	else if (charCode == 45) keyName = "insert"; // insert
	else if (charCode == 46) keyName = "delete"; // delete
	else if (charCode == 91) keyName = "left window"; // left window
	else if (charCode == 92) keyName = "right window"; // right window
	else if (charCode == 93) keyName = "select key"; // select key
	else if (charCode == 96) keyName = "numpad 0"; // numpad 0
	else if (charCode == 97) keyName = "numpad 1"; // numpad 1
	else if (charCode == 98) keyName = "numpad 2"; // numpad 2
	else if (charCode == 99) keyName = "numpad 3"; // numpad 3
	else if (charCode == 100) keyName = "numpad 4"; // numpad 4
	else if (charCode == 101) keyName = "numpad 5"; // numpad 5
	else if (charCode == 102) keyName = "numpad 6"; // numpad 6
	else if (charCode == 103) keyName = "numpad 7"; // numpad 7
	else if (charCode == 104) keyName = "numpad 8"; // numpad 8
	else if (charCode == 105) keyName = "numpad 9"; // numpad 9
	else if (charCode == 106) keyName = "multiply"; // multiply
	else if (charCode == 107) keyName = "add"; // add
	else if (charCode == 109) keyName = "subtract"; // subtract
	else if (charCode == 110) keyName = "decimal point"; // decimal point
	else if (charCode == 111) keyName = "divide"; // divide
	else if (charCode == 112) keyName = "F1"; // F1
	else if (charCode == 113) keyName = "F2"; // F2
	else if (charCode == 114) keyName = "F3"; // F3
	else if (charCode == 115) keyName = "F4"; // F4
	else if (charCode == 116) keyName = "F5"; // F5
	else if (charCode == 117) keyName = "F6"; // F6
	else if (charCode == 118) keyName = "F7"; // F7
	else if (charCode == 119) keyName = "F8"; // F8
	else if (charCode == 120) keyName = "F9"; // F9
	else if (charCode == 121) keyName = "F10"; // F10
	else if (charCode == 122) keyName = "F11"; // F11
	else if (charCode == 123) keyName = "F12"; // F12
	else if (charCode == 144) keyName = "num lock"; // num lock
	else if (charCode == 145) keyName = "scroll lock"; // scroll lock
	else if (charCode == 186) keyName = ";"; // semi-colon
	else if (charCode == 187) keyName = "="; // equal-sign
	else if (charCode == 188) keyName = ","; // comma
	else if (charCode == 189) keyName = "-"; // dash
	else if (charCode == 190) keyName = "."; // period
	else if (charCode == 191) keyName = "/"; // forward slash
	else if (charCode == 192) keyName = "tilde (~`)"; // grave accent
	else if (charCode == 219) keyName = "["; // open bracket
	else if (charCode == 220) keyName = "\\"; // back slash
	else if (charCode == 221) keyName = "]"; // close bracket
	else if (charCode == 222) keyName = "'"; // single quote

	textBox.val(modifiers + keyName);

	var hotkeyValue = (e.ctrlKey ? "1" : "0") + "|" + (e.altKey ? "1" : "0") + "|" + (e.shiftKey ? "1" : "0") + "|" + charCode + "|" + keyName;
	settings.setItem(textBox.attr("hotkeyId"), hotkeyValue);

	return false;
}
function Hotkey_ToggleFullscreen()
{
	toggleFullScreen();
}
function Hotkey_ToggleSidebar()
{
	if ($("#layoutleft").outerWidth(true) == 0)
		$("#layoutleft").css("width", layoutLeftOriginalWidth + "px");
	else
		$("#layoutleft").css("width", "0px");
	resized();
}
function Hotkey_ToggleCameraLabels()
{
	if (settings.ui2_cameraLabels_enabled == "1")
		settings.ui2_cameraLabels_enabled = "0";
	else
		settings.ui2_cameraLabels_enabled = "1";
	cameraNameLabels.show(true);
}
function Hotkey_DownloadFrame()
{
	$("#save_snapshot_btn").get(0).click();
}
function Hotkey_PlayPause()
{
	Playback_PlayPause();
}
function Hotkey_NextClip()
{
	Playback_NextClip();
}
function Hotkey_PreviousClip()
{
	Playback_PreviousClip();
}
function Hotkey_SkipAhead()
{
	Playback_Skip(1000 * parseInt(settings.ui2_skipAmount));
}
function Hotkey_SkipBack()
{
	Playback_Skip(-1000 * parseInt(settings.ui2_skipAmount));
}
function Hotkey_PlayFaster()
{
	Playback_SpeedUp();
}
function Hotkey_PlaySlower()
{
	Playback_SlowDown();
}
function Hotkey_PlayForwardReverse()
{
	Playback_Reverse();
}
function Hotkey_DigitalZoomIn()
{
	DigitalZoomNow(1, true);
}
function Hotkey_DigitalZoomOut()
{
	DigitalZoomNow(-1, true);
}
function Hotkey_DigitalPanUp()
{
	digitalPanUp_isActive = true;
	StartDigitalPanning();
}
function Hotkey_DigitalPanDown()
{
	digitalPanDown_isActive = true;
	StartDigitalPanning();
}
function Hotkey_DigitalPanLeft()
{
	digitalPanLeft_isActive = true;
	StartDigitalPanning();
}
function Hotkey_DigitalPanRight()
{
	digitalPanRight_isActive = true;
	StartDigitalPanning();
}
function Hotkey_DigitalPanUp_Up()
{
	digitalPanUp_isActive = false;
}
function Hotkey_DigitalPanDown_Up()
{
	digitalPanDown_isActive = false;
}
function Hotkey_DigitalPanLeft_Up()
{
	digitalPanLeft_isActive = false;
}
function Hotkey_DigitalPanRight_Up()
{
	digitalPanRight_isActive = false;
}
function Hotkey_PtzUp()
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		SendOrQueuePtzCommand(currentlyLoadingImage.id, 2);
}
function Hotkey_PtzDown()
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		SendOrQueuePtzCommand(currentlyLoadingImage.id, 3);
}
function Hotkey_PtzLeft()
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		SendOrQueuePtzCommand(currentlyLoadingImage.id, 0);
}
function Hotkey_PtzRight()
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		SendOrQueuePtzCommand(currentlyLoadingImage.id, 1);
}
function Hotkey_PtzIn()
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		SendOrQueuePtzCommand(currentlyLoadingImage.id, 5);
}
function Hotkey_PtzOut()
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		SendOrQueuePtzCommand(currentlyLoadingImage.id, 6);
}
function Hotkey_PtzUp_Up()
{
	SendOrQueuePtzCommand(currentlyLoadingImage.id, 2, true);
}
function Hotkey_PtzDown_Up()
{
	SendOrQueuePtzCommand(currentlyLoadingImage.id, 3, true);
}
function Hotkey_PtzLeft_Up()
{
	SendOrQueuePtzCommand(currentlyLoadingImage.id, 0, true);
}
function Hotkey_PtzRight_Up()
{
	SendOrQueuePtzCommand(currentlyLoadingImage.id, 1, true);
}
function Hotkey_PtzIn_Up()
{
	SendOrQueuePtzCommand(currentlyLoadingImage.id, 5, true);
}
function Hotkey_PtzOut_Up()
{
	SendOrQueuePtzCommand(currentlyLoadingImage.id, 6, true);
}
function Hotkey_PtzPreset(num)
{
	if (currentlyLoadingImage.ptz && currentlyLoadingImage.isLive)
		PTZ_async_noguarantee(currentlyLoadingImage.id, 100 + parseInt(num));
}
///////////////////////////////////////////////////////////////
// Digital Panning Hotkey Helpers /////////////////////////////
///////////////////////////////////////////////////////////////
var digitalPanInterval = null;
var digitalPanUp_isActive = false;
var digitalPanDown_isActive = false;
var digitalPanLeft_isActive = false;
var digitalPanRight_isActive = false;
function StartDigitalPanning()
{
	if (digitalPanInterval == null)
	{
		digitalPanInterval = setInterval(function ()
		{
			DoDigitalPan();
		}, 33);
		DoDigitalPan();
	}
}
function DoDigitalPan()
{
	var dx = 0;
	var dy = 0;
	var panSpeed = 30 * Math.sqrt(digitalZoom);
	if (digitalPanUp_isActive)
		dy += panSpeed;
	if (digitalPanDown_isActive)
		dy -= panSpeed;
	if (digitalPanLeft_isActive)
		dx += panSpeed;
	if (digitalPanRight_isActive)
		dx -= panSpeed;
	if (dx == 0 && dy == 0)
	{
		EndDigitalPanning();
		return;
	}
	imgDigitalZoomOffsetX += dx;
	imgDigitalZoomOffsetY += dy;
	ImgResized(true);
}
function EndDigitalPanning()
{
	if (digitalPanInterval != null)
	{
		clearInterval(digitalPanInterval);
		digitalPanInterval = null;
	}
}
///////////////////////////////////////////////////////////////
// Update Notifications ///////////////////////////////////////
///////////////////////////////////////////////////////////////
var hoursBetweenAutomaticUpdateChecks = 12;
var showMessageIfNoUpdateAvailable = false;
function CheckForUpdates_Automatic()
{
	if (settings.ui2_doAutoUpdateCheck == "1")
	{
		var lastUpdateCheck = parseInt(settings.ui2_lastUpdateCheck);
		var timeNow = new Date().getTime();
		if (timeNow - lastUpdateCheck > (1000 * 60 * 60 * hoursBetweenAutomaticUpdateChecks))
		{
			CheckForUpdates(false);
		}
	}
}
function CheckForUpdates(manuallyTriggered)
{
	showMessageIfNoUpdateAvailable = manuallyTriggered;
	var timeMs = new Date().getTime();
	settings.ui2_lastUpdateCheck = timeMs;
	$.getScript("http://www.ipcamtalk.com/bp08/ui2_version.js?nocache=" + timeMs)
		.fail(function (jqxhr, settings, exception)
		{
			showMessageIfNoUpdateAvailable = false;
			showWarningToast("Unable to check for updates at this time.", 5000);
		});
}
function CompareVersions(v1, v2)
{
	var v1Parts = v1.split(".");
	var v2Parts = v2.split(".");
	for (var i = 0; i < v1Parts.length && i < v2Parts.length; i++)
	{
		var v1Num = parseInt(v1Parts[i]);
		var v2Num = parseInt(v2Parts[i]);
		if (v1Num > v2Num)
			return -1;
		else if (v1Num < v2Num)
			return 1;
	}
	if (v1Parts.length > v2Parts.length)
	{
		for (var i = v2Parts.length; i < v1Parts.length; i++)
		{
			var v1Num = parseInt(v1Parts[i]);
			if (v1Num > 0)
				return -1;
			else if (v1Num < 0)
				return 1;
		}
	}
	else if (v1Parts.length < v2Parts.length)
	{
		for (var i = v1Parts.length; i < v2Parts.length; i++)
		{
			var v2Num = parseInt(v2Parts[i]);
			if (v2Num > 0)
				return 1;
			else if (v2Num < 0)
				return -1;
		}
	}
	return 0;
}
function ui2_version_file_loaded()
{
	if (typeof ui2_version_latest != "undefined" && ui2_version_latest)
	{
		if (ui2_version_latest == settings.ui2_lastIgnoredVersion)
		{
			if (!showMessageIfNoUpdateAvailable)
				return;
		}
		if (CompareVersions(ui2_version, ui2_version_latest) > 0)
		{
			var downloadLink = "http://www.ipcamtalk.com/showthread.php/93-I-made-a-better-remote-live-view-page";
			if (typeof ui2_download_link != "undefined" && ui2_download_link)
				downloadLink = ui2_download_link;

			var changesHtml = "";
			if (typeof ui2_version_changes != "undefined" && ui2_version_changes)
				changesHtml = '<div style="margin: 5px 0px; padding:5px;border:1px dotted white;">'
					+ '<div style="margin:5px 0px;">Changes:</div>'
					+ '<div style="margin:5px 0px;">' + ui2_version_changes + '</div>'
					+ '</div>';

			showInfoToast('<div class="updateAvailableBox">'
				+ '<div>UI2 Update Available!</div>'
				+ '<div style="margin-top:4px;">New Version: <span style="font-weight:bold">' + ui2_version_latest + "</span></div>"
				+ '<div style="margin:10px 0px;"><input type="button" class="simpleTextButton btnBlue" onclick="window.open(\'' + downloadLink + '\')" value="Download" /> '
				+ 'or <input type="button" class="simpleTextButton btnYellow" onclick="ui2_ignore_update(this)" value="Ignore" title="If you click Ignore, you will not be notified again about this version." /> update.</div>'
				+ changesHtml
				+ '<div>You are running <span style="color:#FFFF00">' + ui2_version + "</span></div>"
				+ '<div style="margin-top:10px;"><input type="button" class="simpleTextButton btnRed" onclick="ui2_disable_updates(this)" value="Disable update checks" /></div>'
				+ '</div>'
				, 360000, true);
		}
		else
		{
			if (showMessageIfNoUpdateAvailable)
				showInfoToast("No update is available.", 5000);
		}
	}
	else
	{
		if (showMessageIfNoUpdateAvailable)
			showErrorToast("Unexpected server response.", 5000);
	}
	showMessageIfNoUpdateAvailable = false;
}
function ui2_ignore_update(ele)
{
	$(ele).parents(".toast").children(".toast-close-button").click();
	settings.ui2_lastIgnoredVersion = ui2_version_latest;
	showInfoToast("You will not be notified again about version " + ui2_version_latest + ".", 30000);
}
function ui2_disable_updates(ele)
{
	$(ele).parents(".toast").children(".toast-close-button").click();
	$("#optionDialog_option_ui2_doAutoUpdateCheck").removeAttr("checked");
	settings.ui2_doAutoUpdateCheck = "0";
	showInfoToast("Automatic update checks have been disabled. You may re-enable them in the settings menu.", 30000);
}
///////////////////////////////////////////////////////////////
// Frame rate counter /////////////////////////////////////////
///////////////////////////////////////////////////////////////
var fps =
	{
		startTime: 0,
		frameNumber: 0,
		getFPS: function ()
		{
			this.frameNumber++;
			var d = new Date().getTime(),
				currentTime = (d - this.startTime) / 1000,
				result = (this.frameNumber / currentTime).toFixed(2);

			if (currentTime > 1)
			{
				this.startTime = new Date().getTime();
				this.frameNumber = 0;
			}
			return result;

		}
	};
///////////////////////////////////////////////////////////////
// Host Redirection ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
// all ajax page loads, JSON API requests, and camera imagery requests are sent to remoteBaseURL.
// Keep remoteBaseURL == "/" to target the local server as normal.
var remoteBaseURL = "/";
var remoteServerName = "";
var remoteServerUser = "";
var remoteServerPass = "";
var isUsingRemoteServer = false;
var isLoggingOut = false;
var showServerListAtStartup = false;
function SetRemoteServer(serverName)
{
	if (serverName == "")
	{
		remoteServerName = remoteServerUser = remoteServerPass = "";
		remoteBaseURL = "/";
		isUsingRemoteServer = false;
	}
	else
	{
		var server = GetServerWithName(serverName);
		if (server == null)
		{
			showErrorToast("No server is configured with name " + htmlEncode(serverName), 10000);
			return;
		}
		remoteBaseURL = "http://" + server.host + "/";
		remoteServerName = server.name;
		remoteServerUser = server.user;
		remoteServerPass = server.pass;
		isUsingRemoteServer = true;
	}
}
function GetRemoteSessionArg(prefix, overrideRemoteRequirement)
{
	if (isUsingRemoteServer)
		return prefix + "session=" + latestAPISession;
	else if (overrideRemoteRequirement)
		return prefix + "session=" + $.cookie("session");
	else
		return "";
}
function SendToServerListOnStartup()
{
	var querystr;
	if (location.search == "")
		querystr = "?serverlist=1";
	else if (showServerListAtStartup)
		querystr = location.search;
	else
		querystr = location.search + "&serverList=1";

	location.href = location.protocol + '//' + location.host + location.pathname + querystr + location.hash;
}
function ReloadWithoutServerList()
{
	var querystr;
	if (location.search == "")
		querystr = "";
	else if (showServerListAtStartup)
		querystr = location.search.replace(/&?serverlist=1/i, '');
	else
		querystr = location.search;

	location.href = location.protocol + '//' + location.host + location.pathname + querystr + location.hash;
}
///////////////////////////////////////////////////////////////
// On/Off Button //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function GetOnOffButtonMarkup(settingId, startOn, callbackMethodName)
{
	return GetToggleButtonMarkup(settingId, startOn, callbackMethodName, "ON", "OFF");
}
function GetToggleButtonMarkup(settingId, startOn, callbackMethodName, textOn, textOff, additionalClass)
{
	return '<div mysetting="' + settingId + '" class="onOffButton' + (startOn ? ' on' : '') + (additionalClass ? ' ' + additionalClass : '') + '" onclick="onOffButtonClick(this, &quot;' + callbackMethodName + '&quot;)" texton="' + textOn + '" textoff="' + textOff + '">' + (startOn ? textOn : textOff) + '</div>';
}
function onOffButtonClick(ele, callbackMethodName)
{
	var $btn = $(ele);
	if ($btn.hasClass("on"))
	{
		$btn.removeClass("on");
		$btn.html($btn.attr("textoff"));
	}
	else
	{
		$btn.addClass("on");
		$btn.html($btn.attr("texton"));
	}
	try
	{
		window[callbackMethodName]($btn.attr("mysetting"), $btn.hasClass("on"));
	}
	catch (ex)
	{
		showErrorToast(ex);
	}
}
///////////////////////////////////////////////////////////////
// HLS H264 Streaming with Clappr /////////////////////////////
///////////////////////////////////////////////////////////////
var hlsPlayerInitStarted = false; // True if script loading has begun.
var hlsPlayerInitFinished = false; // True if script loading has succeeded or failed.
var hlsPlayerInitSucceeded = false; // True if script loading has succeeded.
var hlsPlayerDialog = null;
var hlsPlayerContainer = null;
var hlsPlayerObj = null;
var hlsPlayerLastCamId = "";
function InitializeHLSPlayer(camId)
{
	if (hlsPlayerInitStarted)
		return;
	$(window).resize(resizeHlsPlayer);
	hlsPlayerInitStarted = true;
	$.cachedScript("clappr/clappr.min.js?v=" + ui2_version)
		.done(function (script, textStatus)
		{
			hlsPlayerInitFinished = true;
			hlsPlayerInitSucceeded = true;
			BeginHlsPlayback(camId);
		})
		.fail(function (jqxhr, settings, exception)
		{
			hlsPlayerInitFinished = true;
			CloseHLSPlayerDialog();
			showErrorToast("Failed to load HLS player script.");
		});
}
function OpenHLSPlayerDialog(camId)
{
	h264Player.Disable();
	hlsPlayerLastCamId = camId;
	hlsPlayerContainer = $('<div style="overflow: hidden;"></div>');
	hlsPlayerDialog = hlsPlayerContainer.modal(
		{
			removeElementOnClose: true
			, onClosing: function ()
			{
				hlsPlayerContainer = null;
				hlsPlayerDialog = null;
				if (hlsPlayerObj != null)
					hlsPlayerObj.stop();
				hlsPlayerObj = null;
				if (!JpegSuppressionDialogIsOpen())
					h264Player.Reinitialize();
			}
		});
	if (!hlsPlayerInitFinished)
	{
		hlsPlayerContainer.append('<img src="ui2/ajax-loader-clips.gif" style="margin: 20px;" />');
		InitializeHLSPlayer(camId);
	}
	else
	{
		if (hlsPlayerInitSucceeded)
			BeginHlsPlayback(camId);
	}
}
function CloseHLSPlayerDialog()
{
	if (hlsPlayerDialog != null)
		if (hlsPlayerDialog.close())
			hlsPlayerDialog = null;
}
function BeginHlsPlayback(camId)
{
	if (hlsPlayerContainer != null)
	{
		hlsPlayerContainer.empty();
		hlsPlayerContainer.append('<div id="hlsPlayer"></div>');

		var src = remoteBaseURL + "h264/" + camId + "/temp.m3u8" + GetRemoteSessionArg("?", true);
		hlsPlayerObj = new Clappr.Player({ source: src, parentId: "#hlsPlayer", autoPlay: false, disableVideoTagContextMenu: true });
		hlsPlayerObj.on('error', onHlsError);
		hlsPlayerObj.on('fullscreen', function () { setTimeout(resizeHlsPlayer, 0); setTimeout(resizeHlsPlayer, 100); });
		hlsPlayerObj.play();
		resizeHlsPlayer();

		registerHlsContextMenu($("#hlsPlayer video"));
	}
}
function openHlsButtonClick()
{
	OpenHLSPlayerDialog(currentlyLoadingImage.id);
}
function onHlsError(obj)
{
	var description = "Unknown";
	try
	{
		var code = obj.error.code;
		if (code == 1)
			description = "Aborted";
		else if (code == 2)
			description = "Network Error";
		else if (code == 3)
			description = "Decoding Error";
		else if (code == 4)
			description = "Source Not Supported";
	}
	catch (ex)
	{
	}
	showErrorToast("Video player reports error: " + description);
}
function hlsPlayerIsBlockingJpegRefresh()
{
	return hlsPlayerDialog != null;
}
function resizeHlsPlayer()
{
	if (hlsPlayerContainer != null && hlsPlayerDialog != null)
	{
		var playerSizeObj = hlsPlayerContainer.find('[data-player]');
		playerSizeObj.css('width', hlsPlayerDialog.$dialog.width());
		playerSizeObj.css('height', hlsPlayerDialog.$dialog.height());
	}
}
///////////////////////////////////////////////////////////////
// Jpeg Refresh Suppression Dialog ////////////////////////////
///////////////////////////////////////////////////////////////
var jpegSuppressionDialog = null;
function OpenJpegSuppressionDialog()
{
	CloseJpegSuppressionDialog();
	jpegSuppressionDialog = $('<div style="padding:10px;" onclick="CloseJpegSuppressionDialog();">To save bandwidth, video is paused until you close this dialog.</div>').modal(
		{
			removeElementOnClose: true
			, onClosing: function ()
			{
				jpegSuppressionDialog = null;
				h264Player.Reinitialize();
			}
			, maxWidth: 200
			, maxHeight: 200
		});
}
function JpegSuppressionDialogIsOpen()
{
	return jpegSuppressionDialog != null;
}
function CloseJpegSuppressionDialog()
{
	if (jpegSuppressionDialog != null)
		if (jpegSuppressionDialog.close())
			jpegSuppressionDialog = null;
}
///////////////////////////////////////////////////////////////
// Window/Tab Focus ///////////////////////////////////////////
///////////////////////////////////////////////////////////////
var windowHasFocus = true;
$(window).on("focus", function ()
{
	windowHasFocus = true;
});
$(window).on("blur", function ()
{
	windowHasFocus = false;
});
///////////////////////////////////////////////////////////////
// Object To Html Table ///////////////////////////////////////
///////////////////////////////////////////////////////////////
function ArrayToHtmlTable(a)
{
	var $table = $("<table></table>");
	var $thead = $("<thead></thead>");
	var $theadrow = $("<tr></tr>");
	var $tbody = $("<tbody></tbody>");
	$thead.append($theadrow);
	$table.append($thead);
	$table.append($tbody);
	var columnSpec = new Object();
	var columnIdx = 0;
	for (var i = 0; i < a.length; i++)
	{
		for (var key in a[i])
		{
			if (typeof columnSpec[key] == "undefined")
			{
				$theadrow.append($("<th></th>").text(key));
				columnSpec[key] = columnIdx++;
			}
		}
	}
	for (var i = 0; i < a.length; i++)
	{
		var newRow = new Object();
		for (var key in a[i])
		{
			var value = a[i][key];
			var idx = columnSpec[key];
			newRow[idx] = value;
		}
		var $row = $("<tr></tr>");
		for (var n = 0; n < columnIdx; n++)
		{
			if (typeof newRow[n] == "undefined")
				$row.append("<td></td>");
			else
				$row.append($("<td></td>").text(newRow[n]));
		}
		$tbody.append($row);
	}
	return $table;
}
///////////////////////////////////////////////////////////////
// Save Images to Local Storage ///////////////////////////////
///////////////////////////////////////////////////////////////
function PersistImageFromUrl(settingsKey, url, onSuccess, onFail)
{
	if (!isCanvasSupported())
	{
		if (onFail)
			onFail("Browser does not support the Canvas element.");
		return;
	}
	var tries = 0;
	var tmpImg = document.createElement("img");
	tmpImg.crossOrigin = "Anonymous";
	var $tmpImg = $(tmpImg);
	$("#preloadcontainer").append(tmpImg);
	$tmpImg.load(function ()
	{
		if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0)
		{
			// Failed
			if (tries++ < 2)
				$tmpImg.attr("src", url);
			else
			{
				$tmpImg.remove();
				if (onFail)
					onFail("Image was invalid.");
			}
		}
		else
		{
			var imgCanvas = document.createElement("canvas"),
				imgContext = imgCanvas.getContext("2d");

			// Make sure canvas is as big as the picture
			imgCanvas.width = tmpImg.width;
			imgCanvas.height = tmpImg.height;

			// Draw image into canvas element
			imgContext.drawImage(tmpImg, 0, 0, tmpImg.width, tmpImg.height);

			// Get canvas contents as a data URL
			var imgAsDataURL = imgCanvas.toDataURL("image/jpeg");

			$tmpImg.remove();

			// Save image into settings
			try
			{
				settings.setItem(settingsKey, imgAsDataURL);
			}
			catch (e)
			{
				// either the settings object does not exist or it is full
				if (onFail)
					onFail("Local Storage may be full!");
				return;
			}

			if (onSuccess)
				onSuccess(imgAsDataURL);
		}
	});
	$tmpImg.error(function ()
	{
		if (tries++ < 2)
			$tmpImg.attr("src", url);
		else
		{
			$tmpImg.remove();
			if (onFail)
				onFail("Unable to load image from server.");
		}
	});
	$tmpImg.attr("src", url);
}
///////////////////////////////////////////////////////////////
// Base64 /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var Base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (b) { var d = "", c, a, f, g, h, e, k = 0; for (b = Base64._utf8_encode(b); k < b.length;)c = b.charCodeAt(k++), a = b.charCodeAt(k++), f = b.charCodeAt(k++), g = c >> 2, c = (c & 3) << 4 | a >> 4, h = (a & 15) << 2 | f >> 6, e = f & 63, isNaN(a) ? h = e = 64 : isNaN(f) && (e = 64), d = d + this._keyStr.charAt(g) + this._keyStr.charAt(c) + this._keyStr.charAt(h) + this._keyStr.charAt(e); return d }, decode: function (b)
	{
		var d = "", c, a, f, g, h, e = 0; for (b = b.replace(/[^A-Za-z0-9\+\/\=]/g, ""); e <
			b.length;)c = this._keyStr.indexOf(b.charAt(e++)), a = this._keyStr.indexOf(b.charAt(e++)), g = this._keyStr.indexOf(b.charAt(e++)), h = this._keyStr.indexOf(b.charAt(e++)), c = c << 2 | a >> 4, a = (a & 15) << 4 | g >> 2, f = (g & 3) << 6 | h, d += String.fromCharCode(c), 64 != g && (d += String.fromCharCode(a)), 64 != h && (d += String.fromCharCode(f)); return Base64._utf8_decode(d)
	}, _utf8_encode: function (b)
	{
		b = b.replace(/\r\n/g, "\n"); for (var d = "", c = 0; c < b.length; c++)
		{
			var a = b.charCodeAt(c); 128 > a ? d += String.fromCharCode(a) : (127 < a && 2048 > a ? d += String.fromCharCode(a >>
				6 | 192) : (d += String.fromCharCode(a >> 12 | 224), d += String.fromCharCode(a >> 6 & 63 | 128)), d += String.fromCharCode(a & 63 | 128))
		} return d
	}, _utf8_decode: function (b) { var d = "", c = 0, a; for (c1 = c2 = 0; c < b.length;)a = b.charCodeAt(c), 128 > a ? (d += String.fromCharCode(a), c++) : 191 < a && 224 > a ? (c2 = b.charCodeAt(c + 1), d += String.fromCharCode((a & 31) << 6 | c2 & 63), c += 2) : (c2 = b.charCodeAt(c + 1), c3 = b.charCodeAt(c + 2), d += String.fromCharCode((a & 15) << 12 | (c2 & 63) << 6 | c3 & 63), c += 3); return d }
};
///////////////////////////////////////////////////////////////
// Misc ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
function isCanvasSupported()
{
	var elem = document.createElement('canvas');
	return !!(elem.getContext && elem.getContext('2d'));
}
function logout()
{
	isLoggingOut = true;
	if (isUsingRemoteServer)
	{
		ExecJSON({ cmd: "logout" }, function ()
		{
			SendToServerListOnStartup();
		}, function ()
			{
				location.href = remoteBaseURL + 'logout.htm' + GetRemoteSessionArg("?");
			});
	}
	else
	{
		ExecJSON({ cmd: "logout" }, function ()
		{
			location.href = remoteBaseURL + "login.htm?autologin=0&page=" + encodeURIComponent(location.pathname);
		}, function ()
			{
				location.href = remoteBaseURL + 'logout.htm';
			});
	}
}
function logoutOldSession(oldSession)
{
	// When running multiple instances of the UI in the same browser, this causes one instance to log out the session belonging to another instance.
	// As long as cookies are sharing sessions between multiple browser tabs, this code should not be enabled.
	// An alternative would be to have Ken include the user name in the session data, so we could avoid creating unnecessary new sessions in the first place.  Then maybe it would be safe to turn this feature on.
	//if (oldSession != null && oldSession != $.cookie("session"))
	//	ExecJSON({ cmd: "logout", session: oldSession });
}
function makeUnselectable($target)
{
	$target
		.addClass('unselectable') // All these attributes are inheritable
		.attr('unselectable', 'on') // For IE9 - This property is not inherited, needs to be placed onto everything
		.attr('draggable', 'false') // For moz and webkit, although Firefox 16 ignores this when -moz-user-select: none; is set, it's like these properties are mutually exclusive, seems to be a bug.
		.on('dragstart', function () { return false; });  // Needed since Firefox 16 seems to ingore the 'draggable' attribute we just applied above when '-moz-user-select: none' is applied to the CSS 

	$target // Apply non-inheritable properties to the child elements
		.find('*')
		.attr('draggable', 'false')
		.attr('unselectable', 'on');
};
function SetLoadedStatus(selector)
{
	var loadingStatusObj = $(selector);
	if (loadingStatusObj.length > 0)
	{
		loadingStatusObj.html("OK");
		loadingStatusObj.css("color", "#00CC00");
	}
	FinishLoadingIfConditionsMet();
}
function SetErrorStatus(selector, errorMessage)
{
	var loadingStatusObj = $(selector);
	if (loadingStatusObj.length > 0)
	{
		loadingStatusObj.html("FAIL");
		loadingStatusObj.css("color", "#CC0000");
	}
	if (typeof errorMessage != "undefined" && errorMessage != null && errorMessage != "")
		showErrorToast(errorMessage, 600000);
}

function BlueIrisColorToCssColor(biColor)
{
	var colorHex = biColor.toString(16).padLeft(8, '0').substr(2);
	return colorHex.substr(4, 2) + colorHex.substr(2, 2) + colorHex.substr(0, 2);
}
function GetReadableTextColorHexForBackgroundColorHex(c)
{
	var r = parseInt(c.substr(0, 2), 16);
	var g = parseInt(c.substr(2, 2), 16);
	var b = parseInt(c.substr(4, 2), 16);
	var o = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
	return o > 125 ? "222222" : "DDDDDD";
}
String.prototype.padLeft = function (len, c)
{
	var str = this;
	while (str.length < len)
		str = (c || "&nbsp;") + str;
	return str;
};
function stopDefault(e)
{
	if (e && e.preventDefault)
	{
		e.preventDefault();
	}
	else
	{
		window.event.returnValue = false;
	}
	return false;
}
function JavaScriptStringEncode(str)
{
	return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
function CleanUpGroupName(groupName)
{
	while (groupName.indexOf("+") == 0)
		groupName = groupName.substr(1);
	return groupName;
}
String.prototype.startsWith = function (prefix)
{
	return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function (suffix)
{
	return this.match(suffix + "$") == suffix;
};
function SimpleTextGibberize(plainGibberish)
{
	if (plainGibberish)
	{
		var sbuilder = "";
		for (var i = 0; i < plainGibberish.length; i++)
		{
			sbuilder += String.fromCharCode(((plainGibberish.charCodeAt(i) % 100) * 100) + (plainGibberish.charCodeAt(i) / 100));
		}
		return sbuilder;
	}
	else
		return "";
}
function msToTime(s)
{
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;

	var retVal;
	if (hrs != 0)
		retVal = hrs + ":" + mins.toString().padLeft(2, "0");
	else
		retVal = mins;

	retVal += ":" + secs.toString().padLeft(2, "0");

	retVal += "." + parseInt(ms).toString().padLeft(3, "0");

	return retVal;
}
function GetDateStr(date, includeMilliseconds)
{
	var ampm = "AM";
	var hour = date.getHours();
	if (hour == 0)
	{
		hour = 12;
	}
	else if (hour == 12)
	{
		ampm = "PM";
	}
	else if (hour > 12)
	{
		hour -= 12;
		ampm = "PM";
	}
	var ms = includeMilliseconds ? ("." + date.getMilliseconds()) : "";

	var str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + hour + ":" + date.getMinutes().toString().padLeft(2, '0') + ":" + date.getSeconds().toString().padLeft(2, '0') + ms + " " + ampm;
	return str;
}

function toggleFullScreen()
{
	if (!isFullScreen())
		requestFullScreen();
	else
		exitFullScreen();
}
function isFullScreen()
{
	return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}
function requestFullScreen()
{
	if (document.documentElement.requestFullscreen)
		document.documentElement.requestFullscreen();
	else if (document.documentElement.msRequestFullscreen)
		document.documentElement.msRequestFullscreen();
	else if (document.documentElement.mozRequestFullScreen)
		document.documentElement.mozRequestFullScreen();
	else if (document.documentElement.webkitRequestFullscreen)
		document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
}
function exitFullScreen()
{
	if (document.exitFullscreen)
		document.exitFullscreen();
	else if (document.msExitFullscreen)
		document.msExitFullscreen();
	else if (document.mozCancelFullScreen)
		document.mozCancelFullScreen();
	else if (document.webkitExitFullscreen)
		document.webkitExitFullscreen();
}
function TextAreaKeyHandler(e)
{
	var keyCode = e.keyCode || e.which;

	if (keyCode == 9)
	{
		e.preventDefault();
		var start = $(this).get(0).selectionStart;
		var end = $(this).get(0).selectionEnd;
		var thisText = $(this).val();
		if (start == end)
		{
			if (e.shiftKey)
			{
				if (start > 0 && thisText.charAt(start - 1) == "\t")
				{
					$(this).val(thisText.substring(0, start - 1) + thisText.substring(start));
					$(this).get(0).selectionStart = $(this).get(0).selectionEnd = start - 1;
				}
			}
			else
			{
				$(this).val(thisText.substring(0, start)
					+ "\t"
					+ thisText.substring(start));
				$(this).get(0).selectionStart = $(this).get(0).selectionEnd = start + 1;
			}
		}
		else
		{
			// Some text is selected.  Does it contain any line feeds?
			var selectedText = thisText.substring(start, end);
			if (selectedText.indexOf('\n') == -1)
			{
				// No line feeds.
				if (!e.shiftKey)
				{
					//Replace selected text with tab character
					$(this).val(thisText.substring(0, start) + '\t' + thisText.substring(end));
					$(this).get(0).selectionStart = start + 1;
					$(this).get(0).selectionEnd = start + 1;
				}
			}
			else
			{
				// Selection contains line feeds.  Add or remove a tab from the start of each line that contains selected text.
				var lines = thisText.split('\n');
				var idxCurrent = 0;
				var idxNext = 0;
				var insideSelection = false;
				var startOffset = e.shiftKey ? 0 : 1;
				var endOffset = 0;
				for (var i = 0; i < lines.length; i++)
				{
					idxCurrent = idxNext;
					idxNext += lines[i].length + 1;
					if (start >= idxCurrent && start < idxNext)
						insideSelection = true;
					if (insideSelection)
					{
						if (e.shiftKey)
						{
							if (lines[i].indexOf('\t') == 0)
							{
								if (idxCurrent < start)
									startOffset--;
								endOffset--;
								lines[i] = lines[i].substring(1);
							}
						}
						else
						{
							endOffset++;
							lines[i] = '\t' + lines[i];
						}
					}
					if (end > idxCurrent && end <= idxNext)
						break;
				}
				$(this).val(lines.join('\n'));
				$(this).get(0).selectionStart = start + startOffset;
				$(this).get(0).selectionEnd = end + endOffset;
			}
		}
	}
}
function generateUIDNotMoreThan1million()
{
	return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4)
}
function Clamp(i, min, max)
{
	if (i < min)
		return min;
	if (i > max)
		return max;
	return i;
}
// Performs a deep clone of the specified element, removing all id attributes, data, and event handlers.
function CloneAndStripIdAttributes($ele)
{
	var $clone = $ele.clone(false);
	StripIdAttributesRecursive($clone);
	return $clone;
}
function StripIdAttributesRecursive($ele)
{
	$ele.removeAttr("id");
	$ele.children().each(function (idx, child)
	{
		StripIdAttributesRecursive($(child));
	});
}
function AskYesNo(question, onYes, onNo)
{
	var $dialog = $('<div></div>');
	$dialog.css("text-align", "center");
	$dialog.css("margin", "10px");
	$dialog.addClass("inlineblock");
	if (typeof question == "string")
		$dialog.append("<div>" + question + "</div>");
	else if (typeof question == "object")
		$dialog.append(question);

	var $yesBtn = $('<input type="button" class="simpleTextButton btnGreen" style="font-size:1.5em;" value="Yes" draggable="false" unselectable="on" />');
	var $noBtn = $('<input type="button" class="simpleTextButton btnRed" style="font-size:1.5em;" value="No" draggable="false" unselectable="on" />');
	var $yesNoContainer = $("<div></div>");
	$yesNoContainer.append($yesBtn).append("<span>&nbsp;&nbsp;&nbsp;</span>").append($noBtn);
	$dialog.append($yesNoContainer);

	var modalDialog = $dialog.modal({ sizeToFitContent: true, shrinkOnBothResizePasses: true });

	$yesBtn.click(function ()
	{
		if (typeof onYes == "function")
			try
			{
				onYes();
			} catch (ex) { showErrorToast(ex); }
		modalDialog.close();
	});
	$noBtn.click(function ()
	{
		if (typeof onNo == "function")
			try
			{
				onNo();
			} catch (ex) { showErrorToast(ex); }
		modalDialog.close();
	});
}
var UrlParameters =
	{
		loaded: false,
		parsed_url_params: {},
		Get: function (key)
		{
			if (!this.loaded)
			{
				var params = this.parsed_url_params;
				window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) { params[key.toLowerCase()] = decodeURIComponent(value); })
				this.loaded = true;
			}
			if (typeof this.parsed_url_params[key.toLowerCase()] != 'undefined')
				return this.parsed_url_params[key.toLowerCase()];
			return "";
		}
	};
function htmlEncode(value)
{
	return $('<div/>').text(value).html();
}
function htmlDecode(value)
{
	return $('<div/>').html(value).text();
}
jQuery.cachedScript = function (url, options)
{
	options = $.extend(options || {}, { dataType: "script", cache: true, url: url });
	return jQuery.ajax(options);
};
///////////////////////////////////////////////////////////////
// Custom Events //////////////////////////////////////////////
///////////////////////////////////////////////////////////////
var UI2_CustomEvent =
	{
		customEventRegistry: new Object(),
		AddListener: function (eventName, eventHandler)
		{
			if (typeof this.customEventRegistry[eventName] == "undefined")
				this.customEventRegistry[eventName] = new Array();
			this.customEventRegistry[eventName].push(eventHandler);
		},
		Invoke: function (eventName)
		{
			if (typeof this.customEventRegistry[eventName] != "undefined")
				for (var i = 0; i < this.customEventRegistry[eventName].length; i++)
					this.customEventRegistry[eventName][i]();
		}
	};
///////////////////////////////////////////////////////////////
// Session Timeout ////////////////////////////////////////////
///////////////////////////////////////////////////////////////
$(function ()
{
	UI2_CustomEvent.AddListener("SettingsLoaded", function ()
	{
		var idleTimer = null;
		function idleLogoff()
		{
			isLoggingOut = true;
			location.href = 'timeout.htm?path=' + encodeURIComponent(location.pathname + location.search);
		}
		function resetTimer()
		{
			if (idleTimer != null)
				clearTimeout(idleTimer);
			if (settings.ui2_sessionTimeout > 0)
				idleTimer = setTimeout(idleLogoff, settings.ui2_sessionTimeout * 60 * 1000);
		}
		$(document.body).bind('mousemove keydown click', resetTimer);
		resetTimer();
	});
});
///////////////////////////////////////////////////////////////
// Dynamic CSS Rule Modification //////////////////////////////
///////////////////////////////////////////////////////////////
function getCSSRule(ruleName, deleteFlag)
{               // Return requested style object
	ruleName = ruleName.toLowerCase();                       // Convert test string to lower case.
	if (document.styleSheets)
	{                            // If browser can play with stylesheets
		for (var i = 0; i < document.styleSheets.length; i++)
		{ // For each stylesheet
			var styleSheet = document.styleSheets[i];          // Get the current Stylesheet
			var ii = 0;                                        // Initialize subCounter.
			var cssRule = false;                               // Initialize cssRule. 
			do
			{                                             // For each rule in stylesheet
				if (styleSheet.cssRules)
				{                    // Browser uses cssRules?
					cssRule = styleSheet.cssRules[ii];         // Yes --Mozilla Style
				} else
				{                                      // Browser usses rules?
					cssRule = styleSheet.rules[ii];            // Yes IE style. 
				}                                             // End IE check.
				if (cssRule)
				{                               // If we found a rule...
					if (cssRule.selectorText.toLowerCase() == ruleName)
					{ //  match ruleName?
						if (deleteFlag == 'delete')
						{             // Yes.  Are we deleteing?
							if (styleSheet.cssRules)
							{           // Yes, deleting...
								styleSheet.deleteRule(ii);        // Delete rule, Moz Style
							} else
							{                             // Still deleting.
								styleSheet.removeRule(ii);        // Delete rule IE style.
							}                                    // End IE check.
							return true;                         // return true, class deleted.
						} else
						{                                // found and not deleting.
							return cssRule;                      // return the style object.
						}                                       // End delete Check
					}                                          // End found rule name
				}                                             // end found cssRule
				ii++;                                         // Increment sub-counter
			} while (cssRule)                                // end While loop
		}                                                   // end For loop
	}                                                      // end styleSheet ability check
	return false;                                          // we found NOTHING!
}                                                         // end getCSSRule 

function killCSSRule(ruleName)
{                          // Delete a CSS rule   
	return getCSSRule(ruleName, 'delete');                  // just call getCSSRule w/delete flag.
}                                                         // end killCSSRule

function addCSSRule(ruleName)
{                           // Create a new css rule
	if (document.styleSheets)
	{                            // Can browser do styleSheets?
		if (!getCSSRule(ruleName))
		{                        // if rule doesn't exist...
			if (document.styleSheets[0].addRule)
			{           // Browser is IE?
				document.styleSheets[0].addRule(ruleName, null, 0);      // Yes, add IE style
			} else
			{                                         // Browser is IE?
				document.styleSheets[0].insertRule(ruleName + ' { }', 0); // Yes, add Moz style.
			}                                                // End browser check
		}                                                   // End already exist check.
	}                                                      // End browser ability check.
	return getCSSRule(ruleName);                           // return rule we just created.
}