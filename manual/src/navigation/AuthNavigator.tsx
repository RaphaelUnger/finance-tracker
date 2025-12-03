import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '@/types/navigation';
import { LockScreen } from '@/screens/LockScreen';
import { SetupPinScreen } from '@/screens/SetupPinScreen';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { SecurityService } from '@/services/securityService';
import { setPinStatus, setBiometricStatus } from '@/store/slices/authSlice';
import { LoadingScreen } from '@/components/LoadingScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector(state => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const securityService = SecurityService.getInstance();
      const authState = securityService.getAuthState();
      const biometricInfo = await securityService.getBiometricInfo();

      dispatch(setPinStatus(authState.hasPin));
      dispatch(setBiometricStatus(authState.hasBiometric && biometricInfo.available));

      setIsCheckingAuth(false);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authState.hasPin ? (
        <Stack.Screen
          name="LockScreen"
          component={LockScreen}
          options={{
            gestureEnabled: false, // Prevent swipe back
          }}
        />
      ) : (
        <Stack.Screen
          name="SetupPin"
          component={SetupPinScreen}
          options={{
            gestureEnabled: false, // Prevent swipe back during setup
          }}
        />
      )}
    </Stack.Navigator>
  );
};
