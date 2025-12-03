import { useRef, useEffect } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

export const useAccessibilityFocus = () => {
  const focusRef = useRef<any>(null);

  const focusAccessibility = () => {
    if (focusRef.current) {
      const reactTag = findNodeHandle(focusRef.current);
      if (reactTag) {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    }
  };

  return { focusRef, focusAccessibility };
};

export const useScreenReaderEnabled = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return isScreenReaderEnabled;
};

export const useReduceMotion = () => {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    const checkReduceMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(enabled);
    };

    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return isReduceMotionEnabled;
};

export const useAccessibilityInfo = () => {
  const [accessibilityInfo, setAccessibilityInfo] = useState({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    isReduceTransparencyEnabled: false
  });

  useEffect(() => {
    const loadAccessibilityInfo = async () => {
      try {
        const [
          screenReader,
          reduceMotion,
          boldText,
          grayscale,
          invertColors,
          reduceTransparency
        ] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled(),
          AccessibilityInfo.isBoldTextEnabled(),
          AccessibilityInfo.isGrayscaleEnabled(),
          AccessibilityInfo.isInvertColorsEnabled(),
          AccessibilityInfo.isReduceTransparencyEnabled()
        ]);

        setAccessibilityInfo({
          isScreenReaderEnabled: screenReader,
          isReduceMotionEnabled: reduceMotion,
          isBoldTextEnabled: boldText,
          isGrayscaleEnabled: grayscale,
          isInvertColorsEnabled: invertColors,
          isReduceTransparencyEnabled: reduceTransparency
        });
      } catch (error) {
        console.warn('Error loading accessibility info:', error);
      }
    };

    loadAccessibilityInfo();

    // Set up event listeners
    const subscriptions = [
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        setAccessibilityInfo(prev => ({ ...prev, isScreenReaderEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        setAccessibilityInfo(prev => ({ ...prev, isReduceMotionEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('boldTextChanged', (enabled) => {
        setAccessibilityInfo(prev => ({ ...prev, isBoldTextEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('grayscaleChanged', (enabled) => {
        setAccessibilityInfo(prev => ({ ...prev, isGrayscaleEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('invertColorsChanged', (enabled) => {
        setAccessibilityInfo(prev => ({ ...prev, isInvertColorsEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
        setAccessibilityInfo(prev => ({ ...prev, isReduceTransparencyEnabled: enabled }));
      })
    ];

    return () => {
      subscriptions.forEach(subscription => subscription?.remove());
    };
  }, []);

  return accessibilityInfo;
};

export const announceForScreenReader = (message: string, urgency: 'polite' | 'assertive' = 'polite') => {
  AccessibilityInfo.announceForAccessibility(message);
};

export const setAccessibilityFocus = (ref: React.RefObject<any>) => {
  if (ref.current) {
    const reactTag = findNodeHandle(ref.current);
    if (reactTag) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }
};
