import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SecurityService } from '@/services/securityService';
import { useAppDispatch } from './useRedux';
import { lock, updateActivity } from '@/store/slices/authSlice';

/**
 * Hook to handle app lifecycle and security
 */
export const useAppLifecycle = () => {
  const dispatch = useAppDispatch();
  const securityService = SecurityService.getInstance();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App is coming to foreground
        dispatch(updateActivity());

        // Check if app should be locked due to inactivity
        const shouldLock = securityService.checkAutoLock();
        if (shouldLock) {
          dispatch(lock());
        }
      } else if (nextAppState === 'background') {
        // App is going to background
        // Note: We don't immediately lock here, auto-lock timer handles this
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [dispatch, securityService]);
};
