/* eslint-disable curly */
/* eslint-disable react/display-name */
/* eslint-disable quotes */
/* eslint-disable max-len */
import React, {
	forwardRef,
	PropsWithChildren,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import { LayoutChangeEvent, View, Platform } from 'react-native';
import Animated, {
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import {
	Gesture,
	GestureDetector,
	GestureStateChangeEvent,
	GestureTouchEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
	PinchGestureHandlerEventPayload,
	State,
} from 'react-native-gesture-handler';
import { GestureStateManagerType } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager';
import { clampScale } from './utils';
import {
	MIN_SCALE,
	MAX_SCALE,
} from './constants';
import type {
	AnimationConfigProps,
	ZoomGestureProps,
	ZoomProps,
	ZoomRef,
} from './types';
import { styles } from './styles';

const useZoomGesture = (props: ZoomGestureProps = {}) => {
	const {
		animationFunction = withTiming,
		animationConfig,
		initialScale = 0.85,
		panThreshold = 0,
		onZoomStateChange,
	} = props;

	const baseScale = useSharedValue(initialScale);
	const pinchScale = useSharedValue(1);
	const lastScale = useSharedValue(1);
	const isZoomedIn = useSharedValue(false);

	const containerDimensions = useSharedValue({ width: 0, height: 0 });
	const contentDimensions = useSharedValue({ width: 1, height: 1 });

	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const lastOffsetX = useSharedValue(0);
	const lastOffsetY = useSharedValue(0);
	const panStartOffsetX = useSharedValue(0);
	const panStartOffsetY = useSharedValue(0);
	const startX = useSharedValue(0); // Store initial X position
	const startY = useSharedValue(0); // Store initial Y position

	const handlePanOutsideTimeoutId: React.MutableRefObject<
		number | undefined
	> = useRef();

	const containerRef = useRef<View>(null);
	const scrollWheelSubscriptionRef = useRef<number | null>(null);

	useAnimatedReaction(
		() => isZoomedIn.value,
		(current, prev) => {
			if (current !== prev && onZoomStateChange)
				runOnJS(onZoomStateChange)(current);
		}
	);

	const withAnimation = useCallback(
		(toValue: number, config?: AnimationConfigProps) => {
			'worklet';

			return animationFunction(toValue, {
				duration: 350,
				...config,
				...animationConfig,
			});
		},
		[animationFunction, animationConfig]
	);

	const getContentContainerSize = useCallback(() => {
		return {
			width: containerDimensions.value.width,
			height:
				(contentDimensions.value.height *
					containerDimensions.value.width) /
				contentDimensions.value.width,
		};
	}, [
		containerDimensions.value.width,
		contentDimensions.value.height,
		contentDimensions.value.width,
	]);

	const onWheelScroll = useCallback(
		(event: WheelEvent) => {
			event.preventDefault();
			const scaleStep = event.deltaY < 0 ? 0.1 : -0.1;
			const newScale = lastScale.value + scaleStep;
			const newSafeScale = clampScale(
				newScale,
				MIN_SCALE,
				MAX_SCALE
			);
			lastScale.value = newSafeScale;
			baseScale.value = withAnimation(newSafeScale);
			isZoomedIn.value = newSafeScale > MIN_SCALE;
		},
		[baseScale, isZoomedIn, lastScale, withAnimation]
	);

	const zoomIn = useCallback((): void => {
		let newScale = baseScale.value * 1.25;
		if (newScale > MAX_SCALE) newScale = MAX_SCALE;

		lastScale.value = newScale;

		baseScale.value = withAnimation(newScale);
		pinchScale.value = withAnimation(newScale);

		const newOffsetX = 0;
		lastOffsetX.value = newOffsetX;

		const newOffsetY = 0;
		lastOffsetY.value = newOffsetY;

		translateX.value = newOffsetX;
		translateY.value = newOffsetY;

		isZoomedIn.value = true;
	}, [
		baseScale,
		pinchScale,
		lastOffsetX,
		lastOffsetY,
		translateX,
		translateY,
		isZoomedIn,
		lastScale,
		withAnimation,
	]);

	const zoomOut = useCallback((): void => {
		let newScale = baseScale.value * 0.75;
		if (newScale < 0.75) newScale = 0.75;
		lastScale.value = newScale;

		baseScale.value = withAnimation(newScale);
		pinchScale.value = withAnimation(newScale);

		const newOffsetX = 0;
		lastOffsetX.value = newOffsetX;

		const newOffsetY = 0;
		lastOffsetY.value = newOffsetY;

		translateX.value = withAnimation(newOffsetX);
		translateY.value = withAnimation(newOffsetY);

		if (newScale === 0.75) isZoomedIn.value = false;
	}, [
		baseScale,
		pinchScale,
		lastOffsetX,
		lastOffsetY,
		translateX,
		translateY,
		lastScale,
		isZoomedIn,
		withAnimation,
	]);

	const resetZoom = useCallback((): void => {
		lastScale.value = 1;
		baseScale.value = withAnimation(0.75);
		pinchScale.value = withAnimation(1);
		lastOffsetX.value = 0;
		lastOffsetY.value = 0;
		translateX.value = withAnimation(0);
		translateY.value = withAnimation(0);
		isZoomedIn.value = false;
	}, [
		baseScale,
		isZoomedIn,
		lastOffsetX,
		lastOffsetY,
		lastScale,
		pinchScale,
		translateX,
		translateY,
		withAnimation,
	]);

	const handlePanOutside = useCallback((): void => {
		if (handlePanOutsideTimeoutId.current !== undefined)
			clearTimeout(handlePanOutsideTimeoutId.current);

		handlePanOutsideTimeoutId.current = setTimeout((): void => {
			const { width, height } = getContentContainerSize();
			const effectiveScale = baseScale.value * pinchScale.value;
			const maxOffset = {
				x:
					width * effectiveScale < containerDimensions.value.width
						? 0
						: (width * effectiveScale -
								containerDimensions.value.width) /
							2 /
							effectiveScale,
				y:
					height * effectiveScale < containerDimensions.value.height
						? 0
						: (height * effectiveScale -
								containerDimensions.value.height) /
							2 /
							effectiveScale,
			};

			const isPanedXOutside =
				lastOffsetX.value > maxOffset.x ||
				lastOffsetX.value < -maxOffset.x;
			if (isPanedXOutside) {
				const newOffsetX =
					lastOffsetX.value >= 0 ? maxOffset.x : -maxOffset.x;
				lastOffsetX.value = newOffsetX;
				translateX.value = withAnimation(newOffsetX);
			} else {
				translateX.value = lastOffsetX.value;
			}

			const isPanedYOutside =
				lastOffsetY.value > maxOffset.y ||
				lastOffsetY.value < -maxOffset.y;
			if (isPanedYOutside) {
				const newOffsetY =
					lastOffsetY.value >= 0 ? maxOffset.y : -maxOffset.y;
				lastOffsetY.value = newOffsetY;
				translateY.value = withAnimation(newOffsetY);
			} else {
				translateY.value = lastOffsetY.value;
			}
		}, 10);
	}, [
		getContentContainerSize,
		baseScale,
		pinchScale,
		containerDimensions,
		lastOffsetX,
		lastOffsetY,
		translateX,
		withAnimation,
		translateY,
	]);

	const onDoubleTap = useCallback((): void => {
		if (isZoomedIn.value) zoomOut();
		else zoomIn();
	}, [zoomIn, zoomOut, isZoomedIn]);

	const onLayout = useCallback(
		({
			nativeEvent: {
				layout: { width, height },
			},
		}: LayoutChangeEvent): void => {
			if (
				Platform.OS !== 'ios' &&
				Platform.OS !== 'android' &&
				containerRef.current &&
				!scrollWheelSubscriptionRef.current
			)
				scrollWheelSubscriptionRef.current =
					// @ts-expect-error - web only
					containerRef.current.addEventListener(
						'wheel',
						onWheelScroll
					);

			containerDimensions.value = {
				width,
				height,
			};
		},
		[containerDimensions, onWheelScroll]
	);

	const onLayoutContent = useCallback(
		({
			nativeEvent: {
				layout: { width, height },
			},
		}: LayoutChangeEvent): void => {
			contentDimensions.value = {
				width,
				height,
			};
		},
		[contentDimensions]
	);

	const onPinchEnd = useCallback(
		(scale: number): void => {
			const newScale = lastScale.value * scale;
			lastScale.value = newScale;
			if (newScale > 1) {
				isZoomedIn.value = true;
				baseScale.value = newScale;
				pinchScale.value = 1;
			} else {
				zoomOut();
			}
		},
		[lastScale, baseScale, pinchScale, zoomOut, isZoomedIn]
	);

	const zoomGesture = useMemo(() => {
		const tapGesture = Gesture.Tap()
			.numberOfTaps(2)
			.maxDeltaX(25)
			.maxDeltaY(25)
			.onEnd(() => {
				runOnJS(onDoubleTap)();
			});

		const panGesture = Gesture.Pan()
			.maxPointers(2)
			.onTouchesMove(
				(
					e: GestureTouchEvent,
					state: GestureStateManagerType
				): void => {
					const isSingleTouch = e.numberOfTouches === 1;

					// Only allow panning when zoomed in or single touch
					if (!isZoomedIn.value && !isSingleTouch) {
						state.fail();
						return;
					}

					// Calculate total movement
					const deltaX = Math.abs(
						e.allTouches[0].absoluteX - startX.value
					);
					const deltaY = Math.abs(
						e.allTouches[0].absoluteY - startY.value
					);

					// Only activate if movement exceeds threshold
					if (
						e.state === State.UNDETERMINED ||
						e.state === State.BEGAN
					)
						if (deltaX > panThreshold || deltaY > panThreshold)
							state.activate();
						else state.fail();
				}
			)
			.onStart(
				(
					event: GestureUpdateEvent<PanGestureHandlerEventPayload>
				): void => {
					// Store initial touch position
					startX.value = event.absoluteX;
					startY.value = event.absoluteY;

					// Store initial translation for relative movement
					panStartOffsetX.value = event.translationX;
					panStartOffsetY.value = event.translationY;
				}
			)
			.onUpdate(
				(
					event: GestureUpdateEvent<PanGestureHandlerEventPayload>
				): void => {
					// Calculate relative movement from start position
					const relativeX =
						event.translationX - panStartOffsetX.value;
					const relativeY =
						event.translationY - panStartOffsetY.value;

					// Apply movement scaled by current zoom level
					const effectiveScale = baseScale.value * pinchScale.value;
					translateX.value =
						lastOffsetX.value + relativeX / effectiveScale;
					translateY.value =
						lastOffsetY.value + relativeY / effectiveScale;
				}
			)
			.onEnd(
				(
					event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
				): void => {
					// Calculate final position
					const finalX = event.translationX - panStartOffsetX.value;
					const finalY = event.translationY - panStartOffsetY.value;

					// Update last known position
					const effectiveScale = baseScale.value * pinchScale.value;
					lastOffsetX.value += finalX / effectiveScale;
					lastOffsetY.value += finalY / effectiveScale;

					runOnJS(handlePanOutside)();
				}
			);

		const pinchGesture = Gesture.Pinch()
			.onUpdate(
				({
					scale,
					state,
				}: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
					pinchScale.value = scale;
				}
			)
			.onEnd(
				({
					scale,
					state,
				}: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
					pinchScale.value = scale;
					runOnJS(onPinchEnd)(scale);
				}
			);

		return Gesture.Exclusive(
			Gesture.Simultaneous(pinchGesture, panGesture),
			tapGesture
		);
	}, [
		// Pinch and pan gesture dependency
		pinchScale,
		// Pinch gesture dependencies
		onPinchEnd,
		// Pan gesture dependencies
		isZoomedIn,
		startX,
		startY,
		panThreshold,
		panStartOffsetX,
		panStartOffsetY,
		baseScale,
		translateX,
		lastOffsetX,
		translateY,
		lastOffsetY,
		handlePanOutside,
		// Tap gesture dependencies
		onDoubleTap,
	]);

	const contentContainerAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: baseScale.value * pinchScale.value },
			{ translateX: translateX.value },
			{ translateY: translateY.value },
		],
	}));

	return {
		contentContainerAnimatedStyle,
		zoomGesture,
		onLayout,
		onLayoutContent,
		zoomIn,
		zoomOut,
		resetZoom,
		containerRef,
	};
};

export default forwardRef<ZoomRef, PropsWithChildren<ZoomProps>>(
	(props, ref) => {
		const { style, contentContainerStyle, children, ...rest } = props;

		const {
			zoomIn,
			zoomOut,
			resetZoom,
			zoomGesture,
			contentContainerAnimatedStyle,
			onLayout,
			onLayoutContent,
			containerRef,
		} = useZoomGesture({
			...rest,
		});

		useImperativeHandle(
			ref,
			() => ({
				zoomIn,
				zoomOut,
				resetZoom,
			}),
			[resetZoom, zoomIn, zoomOut]
		);

		return (
			<GestureDetector gesture={zoomGesture}>
				<View
					style={[styles.container, style]}
					onLayout={onLayout}
					collapsable={false}
					ref={containerRef}
				>
					<Animated.View
						style={[
							contentContainerAnimatedStyle,
							contentContainerStyle,
						]}
						onLayout={onLayoutContent}
					>
						{children}
					</Animated.View>
				</View>
			</GestureDetector>
		);
	}
);
