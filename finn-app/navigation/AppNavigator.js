// src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importez les écrans que nous avons créés
import OnboardingScreen from '../screens/OnboardingScreen'; // Assurez-vous que le chemin est correct
import CreateAccountScreen from '../screens/CreateAccountScreen'; // Assurez-vous que le chemin est correct

// Créez l'instance du Stack Navigator
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        // Configure la Stack Navigator pour qu'elle n'affiche pas la barre de navigation par défaut 
        // (header) sur tous les écrans, car nous gérons les en-têtes (flèche de retour) manuellement.
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        {/* Vous ajouterez ici d'autres écrans (Login, Home, etc.) */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;