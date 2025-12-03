import React from 'react';
import { Animated, Easing } from 'react-native';

export interface AnimationConfig {
  duration?: number;
  easing?: any;
  delay?: number;
  useNativeDriver?: boolean;
}

export class AnimationService {
  // Fade animations
  static fadeIn(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: config.duration || 300,
      easing: config.easing || Easing.out(Easing.quad),
      delay: config.delay || 0,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  static fadeOut(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: config.duration || 250,
      easing: config.easing || Easing.in(Easing.quad),
      delay: config.delay || 0,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Scale animations
  static scaleIn(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      delay: config.delay || 0,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  static scaleOut(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: config.duration || 200,
      easing: config.easing || Easing.in(Easing.back(1.7)),
      delay: config.delay || 0,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Slide animations
  static slideInFromBottom(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: config.duration || 400,
      easing: config.easing || Easing.out(Easing.back(1.1)),
      delay: config.delay || 0,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  static slideInFromRight(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: config.duration || 350,
      easing: config.easing || Easing.out(Easing.quad),
      delay: config.delay || 0,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Bounce animations
  static bounce(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: config.duration ? config.duration / 3 : 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: config.useNativeDriver ?? true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: config.duration ? config.duration / 3 : 100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: config.useNativeDriver ?? true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: config.duration ? config.duration / 3 : 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: config.useNativeDriver ?? true,
      }),
    ]);
  }

  // Shake animation
  static shake(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: config.useNativeDriver ?? true,
      }),
      Animated.timing(animatedValue, {
        toValue: -10,
        duration: 50,
        useNativeDriver: config.useNativeDriver ?? true,
      }),
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: config.useNativeDriver ?? true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: config.useNativeDriver ?? true,
      }),
    ]);
  }

  // Stagger animations
  static staggerFadeIn(
    animatedValues: Animated.Value[],
    config: AnimationConfig & { staggerDelay?: number } = {}
  ): Animated.CompositeAnimation {
    const staggerDelay = config.staggerDelay || 100;
    const animations = animatedValues.map((value, index) =>
      this.fadeIn(value, {
        ...config,
        delay: (config.delay || 0) + (index * staggerDelay),
      })
    );
    return Animated.parallel(animations);
  }

  // Custom spring animation for buttons
  static buttonPress(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]);
  }

  // Loading spinner
  static createRotationAnimation(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  }

  // Progress bar animation
  static progressAnimation(
    animatedValue: Animated.Value,
    toValue: number,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue,
      duration: config.duration || 800,
      easing: config.easing || Easing.out(Easing.quad),
      useNativeDriver: false, // Width/height animations can't use native driver
    });
  }

  // Card flip animation
  static flipCard(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 180,
      duration: config.duration || 600,
      easing: config.easing || Easing.inOut(Easing.quad),
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Pulse animation (for notifications)
  static pulse(animatedValue: Animated.Value, config: AnimationConfig = {}): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: config.duration ? config.duration / 2 : 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: config.useNativeDriver ?? true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: config.duration ? config.duration / 2 : 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: config.useNativeDriver ?? true,
        }),
      ])
    );
  }

  // Typing animation for text
  static typeWriter(
    text: string,
    callback: (displayText: string) => void,
    config: { delay?: number; speed?: number } = {}
  ): void {
    const delay = config.delay || 0;
    const speed = config.speed || 50;

    setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        callback(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(timer);
        }
      }, speed);
    }, delay);
  }

  // Parallax effect
  static parallax(
    scrollY: Animated.Value,
    inputRange: number[],
    outputRange: number[]
  ): Animated.AnimatedInterpolation {
    return scrollY.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });
  }

  // Gesture-based animations
  static createPanAnimation(
    gestureState: any,
    animatedValue: Animated.ValueXY
  ): void {
    Animated.spring(animatedValue, {
      toValue: { x: gestureState.dx, y: gestureState.dy },
      useNativeDriver: false,
    }).start();
  }

  static snapToPosition(
    animatedValue: Animated.ValueXY,
    position: { x: number; y: number },
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue: position,
      tension: config.duration ? 100 / (config.duration / 300) : 100,
      friction: 8,
      useNativeDriver: false,
    });
  }

  // Combined animations for complex effects
  static fadeInUp(
    fadeValue: Animated.Value,
    translateValue: Animated.Value,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    return Animated.parallel([
      this.fadeIn(fadeValue, config),
      Animated.timing(translateValue, {
        toValue: 0,
        duration: config.duration || 400,
        easing: config.easing || Easing.out(Easing.back(1.1)),
        delay: config.delay || 0,
        useNativeDriver: config.useNativeDriver ?? true,
      }),
    ]);
  }

  static scaleInFade(
    scaleValue: Animated.Value,
    fadeValue: Animated.Value,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    return Animated.parallel([
      this.scaleIn(scaleValue, config),
      this.fadeIn(fadeValue, { ...config, duration: (config.duration || 300) * 1.2 }),
    ]);
  }

  // Utility functions
  static interpolate(
    animatedValue: Animated.Value,
    inputRange: number[],
    outputRange: number[] | string[]
  ): Animated.AnimatedInterpolation {
    return animatedValue.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });
  }

  static createValue(initialValue: number = 0): Animated.Value {
    return new Animated.Value(initialValue);
  }

  static createValueXY(initialValue: { x: number; y: number } = { x: 0, y: 0 }): Animated.ValueXY {
    return new Animated.ValueXY(initialValue);
  }

  // Animation presets for common UI patterns
  static presets = {
    // Modal animations
    modalSlideUp: (animatedValue: Animated.Value) =>
      this.slideInFromBottom(animatedValue, { duration: 400 }),

    modalFadeIn: (animatedValue: Animated.Value) =>
      this.fadeIn(animatedValue, { duration: 300 }),

    // List item animations
    listItemFadeIn: (animatedValue: Animated.Value, index: number) =>
      this.fadeIn(animatedValue, { delay: index * 50, duration: 300 }),

    listItemSlideIn: (animatedValue: Animated.Value, index: number) =>
      this.slideInFromRight(animatedValue, { delay: index * 80, duration: 400 }),

    // Button animations
    buttonTap: (animatedValue: Animated.Value) =>
      this.buttonPress(animatedValue),

    buttonBounce: (animatedValue: Animated.Value) =>
      this.bounce(animatedValue, { duration: 300 }),

    // Loading animations
    loadingSpinner: (animatedValue: Animated.Value) =>
      this.createRotationAnimation(animatedValue),

    loadingPulse: (animatedValue: Animated.Value) =>
      this.pulse(animatedValue, { duration: 1500 }),

    // Success/Error animations
    successBounce: (animatedValue: Animated.Value) =>
      this.scaleIn(animatedValue),

    errorShake: (animatedValue: Animated.Value) =>
      this.shake(animatedValue),

    // Chart animations
    chartBarGrow: (animatedValue: Animated.Value, delay: number) =>
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 800,
        delay,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: false,
      }),

    chartLineGrow: (animatedValue: Animated.Value) =>
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
  };
}

export default AnimationService;
