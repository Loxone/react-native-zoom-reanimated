import { StyleProp, ViewProps } from 'react-native';
import { AnimatableValue, AnimationCallback, withTiming } from 'react-native-reanimated';

interface ZoomRef {
	zoomIn(): void;
	zoomOut(): void;
	resetZoom(): void;
}

interface ZoomProps {
	style?: StyleProp<ViewProps>;
	contentContainerStyle?: StyleProp<ViewProps>;
	animationConfig?: object;

	animationFunction?<T extends AnimatableValue>(
		toValue: T,
		userConfig?: object,
		callback?: AnimationCallback
	): T;
	panThreshold?: number;
	onZoomStateChange?(zoomState: boolean): void;
}

type AnimationConfigProps = Parameters<typeof withTiming>[1];

interface UseZoomGestureProps {
  animationFunction?: typeof withTiming;
  animationConfig?: AnimationConfigProps;
  doubleTapConfig?: {
    defaultScale?: number;
    minZoomScale?: number;
    maxZoomScale?: number;
  };
}

export type { ZoomRef, ZoomProps, UseZoomGestureProps, AnimationConfigProps };
