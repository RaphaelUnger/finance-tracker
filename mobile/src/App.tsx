import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TransactionList from './screens/TransactionList';
import TransactionForm from './screens/TransactionForm';

export type RootStackParamList = {
    List: undefined;
    Form: { id?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="List">
                <Stack.Screen name="List" component={TransactionList} options={{ title: 'Transactions' }} />
                <Stack.Screen name="Form" component={TransactionForm} options={{ title: 'Add / Edit' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
