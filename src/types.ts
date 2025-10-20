import { StyleProp, ViewProps } from 'react-native';
import {
	AnimatableValue,
	AnimationCallback,
	withTiming,
} from 'react-native-reanimated';

interface ZoomRef {
	zoomIn(): void;
	zoomOut(): void;
	resetZoom(): void;
}

interface ZoomProps {
	style?: StyleProp<ViewProps>;
	contentContainerStyle?: StyleProp<ViewProps>;
	animationConfig?: AnimationConfigProps;

	animationFunction?<T extends AnimatableValue>(
		toValue: T,
		userConfig?: object,
		callback?: AnimationCallback
	): T;
	panThreshold?: number;
	onZoomStateChange?(zoomState: boolean): void;
	initialScale?: number;
}

type AnimationConfigProps = Parameters<typeof withTiming>[1];

interface ZoomGestureProps {
	animationFunction?: typeof withTiming;
	animationConfig?: AnimationConfigProps;
	doubleTapConfig?: {
		defaultScale?: number;
		minZoomScale?: number;
		maxZoomScale?: number;
	};
	initialScale?: number;panThreshold?: number;
    onZoomStateChange?(zoomState: boolean): void;
}

export type { ZoomRef, ZoomProps, ZoomGestureProps, AnimationConfigProps };
