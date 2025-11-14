import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TransactionList from './screens/TransactionList';
import TransactionForm from './screens/TransactionForm';
import Scan from './screens/Scan';
import ScanReview from './screens/ScanReview';

export type RootStackParamList = {
    List: undefined;
    Form: { id?: string } | undefined;
    Scan: undefined;
    ScanReview: { suggestion: any; imageUri?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="List">
                <Stack.Screen name="List" component={TransactionList} options={{ title: 'Transactions' }} />
                <Stack.Screen name="Form" component={TransactionForm} options={{ title: 'Add / Edit' }} />
                <Stack.Screen name="Scan" component={Scan} options={{ title: 'Scan Receipt' }} />
                <Stack.Screen name="ScanReview" component={ScanReview} options={{ title: 'Review Receipt' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
