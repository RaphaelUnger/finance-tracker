import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TransactionList from './screens/TransactionList';
import TransactionForm from './screens/TransactionForm';
import Scan from './screens/Scan';
import ScanReview from './screens/ScanReview';
import Recurrences from './screens/Recurrences';
import { runGenerator } from './services/recurrenceService';
import Reports from './screens/Reports';
import React, { useEffect, useState } from 'react';
import LockScreen from './screens/LockScreen';
import * as LockService from './services/lockService';

export type RootStackParamList = {
    List: undefined;
    Form: { id?: string } | undefined;
    Scan: undefined;
    ScanReview: { suggestion: any; imageUri?: string } | undefined;
    Recurrences: undefined;
    Reports: undefined;
};

const Stack = createNativeStackNavigator();

export default function App() {
    const [unlocked, setUnlocked] = useState(false);
    const [loadingLock, setLoadingLock] = useState(true);

    useEffect(() => {
        // run generator once on app start to materialize due recurring transactions
        (async () => {
            try {
                await runGenerator(30);
            } catch (e) {
                // ignore startup generator errors
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const has = await LockService.hasPin();
            if (!has) {
                setUnlocked(true);
            }
            setLoadingLock(false);
        })();
    }, []);

    if (loadingLock) return null;

    if (!unlocked) {
        return <LockScreen onUnlock={() => setUnlocked(true)} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="List">
                <Stack.Screen name="List" component={TransactionList} options={{ title: 'Transactions' }} />
                <Stack.Screen name="Form" component={TransactionForm} options={{ title: 'Add / Edit' }} />
                <Stack.Screen name="Scan" component={Scan} options={{ title: 'Scan Receipt' }} />
                <Stack.Screen name="ScanReview" component={ScanReview} options={{ title: 'Review Receipt' }} />
                <Stack.Screen name="Recurrences" component={Recurrences} options={{ title: 'Recurring rules' }} />
                <Stack.Screen name="Reports" component={Reports} options={{ title: 'Reports' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
