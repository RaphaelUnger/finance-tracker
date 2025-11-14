import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TransactionList from './screens/TransactionList';
import TransactionForm from './screens/TransactionForm';
import Scan from './screens/Scan';
import ScanReview from './screens/ScanReview';
import Recurrences from './screens/Recurrences';
import { runGenerator } from './services/recurrenceService';

export type RootStackParamList = {
    List: undefined;
    Form: { id?: string } | undefined;
    Scan: undefined;
    ScanReview: { suggestion: any; imageUri?: string } | undefined;
    Recurrences: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="List">
                <Stack.Screen name="List" component={TransactionList} options={{ title: 'Transactions' }} />
                <Stack.Screen name="Form" component={TransactionForm} options={{ title: 'Add / Edit' }} />
                <Stack.Screen name="Scan" component={Scan} options={{ title: 'Scan Receipt' }} />
                <Stack.Screen name="ScanReview" component={ScanReview} options={{ title: 'Review Receipt' }} />
                <Stack.Screen name="Recurrences" component={Recurrences} options={{ title: 'Recurring rules' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
