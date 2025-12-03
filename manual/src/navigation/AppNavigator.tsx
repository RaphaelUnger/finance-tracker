import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { SecurityService } from '@/services/securityService';
import { setAuthState } from '@/store/slices/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingScreen } from '@/components/LoadingScreen';
import ExportImportScreen from '@/screens/ExportImportScreen';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector(state => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const securityService = SecurityService.getInstance();

      // Listen to security service state changes
      const unsubscribe = securityService.addListener((newAuthState) => {
        dispatch(setAuthState(newAuthState));
      });

      // Get initial auth state
      const initialAuthState = securityService.getAuthState();
      dispatch(setAuthState(initialAuthState));

      setIsInitialized(true);

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Still show the app, but in error state
    }
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return <LoadingScreen message="Initializing Finance Tracker..." />;
  }

  const shouldShowAuth = !authState.isAuthenticated || authState.isLocked;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationTypeForReplace: shouldShowAuth ? 'pop' : 'push',
        }}
      >
        {shouldShowAuth ? (
          <Stack.Screen
            name="AuthStack"
            component={AuthNavigator}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainNavigator}
              options={{
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen
              name="ExportImport"
              component={ExportImportScreen}
              options={{
                headerShown: true,
                title: 'Export & Import',
                headerBackTitleVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
