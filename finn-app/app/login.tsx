import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';

import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '@/services/api';

// Dimensions pour une mise en page plus réactive
const { width } = Dimensions.get('window');

type CustomTextInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
  isVisible?: boolean;
  toggleVisibility?: () => void;
  error?: string;
  keyboardType?: string;
};

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  iconName,
  isPassword = false,
  isVisible = false,
  toggleVisibility,
  error,
  keyboardType,
}) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, error && styles.inputError]}>
      <Feather name={iconName} size={20} color={error ? "#FF3B30" : "#666"} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword && !isVisible}
        keyboardAppearance="dark"
        keyboardType={keyboardType as any}
      />
      {isPassword && (
        <TouchableOpacity onPress={toggleVisibility} style={styles.visibilityToggle}>
          <Feather name={isVisible ? "eye" : "eye-off"} size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const LoginScreen = () => {
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Fonction simplifiée pour déterminer la force du mot de passe
  const getPasswordStrength = (pass: string | any[]) => {
    if (pass.length === 0) return 'Weak';
    if (pass.length < 6) return 'Weak';
    if (pass.length < 8) return 'Good';
    return 'Great';
  };
  const passwordStrength = getPasswordStrength(password);

  const validateRegisterForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!fullName.trim()) newErrors.fullName = 'Le nom complet est requis';
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmer le mot de passe est requis';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!agreedToTerms) newErrors.terms = "Vous devez accepter les conditions d'utilisation";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveSession = async (user: { _id: string; firstName: string; lastName: string; email: string }) => {
    const userData = {
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      userId: user._id,
    };
    await AsyncStorage.multiSet([
      ['userData', JSON.stringify(userData)],
      ['userId', user._id],
      ['isLoggedIn', 'true'],
    ]);
  };

  const handleCreateAccount = async () => {
    if (!validateRegisterForm()) return;
    setIsLoading(true);
    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];
      const user = await registerUser({ firstName, lastName, email: email.trim(), password });
      await saveSession(user);
      router.replace('/');
    } catch (error: any) {
      setErrors({ general: error.message || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const newErrors: {[key: string]: string} = {};
    if (!email.trim()) newErrors.email = "L'email est requis";
    if (!password) newErrors.password = 'Le mot de passe est requis';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setIsLoading(true);
    try {
      const { user } = await loginUser(email.trim(), password);
      await saveSession(user);
      router.replace('/');
    } catch (error: any) {
      setErrors({ general: error.message || 'Email ou mot de passe incorrect.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <Text style={styles.mainTitle}>
          {isSignInMode ? 'Sign In' : 'Create Your Account'}
        </Text>

        {/* Full Name — register only */}
        {!isSignInMode && (
          <CustomTextInput
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            iconName="user"
            error={errors.fullName}
          />
        )}

        <CustomTextInput
          label="Email"
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          iconName="mail"
          error={errors.email}
          keyboardType="email-address"
        />

        <CustomTextInput
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          iconName="lock"
          isPassword
          isVisible={isPasswordVisible}
          toggleVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
          error={errors.password}
        />

        {/* Password strength + confirm — register only */}
        {!isSignInMode && (
          <>
            <View style={styles.passwordStrengthBarContainer}>
              <Text style={styles.passwordStrengthText}>
                Password strength: {passwordStrength}
              </Text>
              {passwordStrength !== 'Weak' && <Ionicons name="checkmark-circle" size={16} color="#4CD964" style={{marginLeft: 5}} />}
              <View style={[styles.strengthBarBackground, { marginLeft: 10 }]}>
                <View style={[styles.strengthBar, styles[`strengthBar_${passwordStrength}`]]} />
              </View>
            </View>

            <CustomTextInput
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              iconName="lock"
              isPassword
              isVisible={isConfirmPasswordVisible}
              toggleVisibility={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              error={errors.confirmPassword}
            />

            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive, errors.terms && styles.checkboxError]}>
                {agreedToTerms && <Ionicons name="checkmark" size={18} color="#000" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the <Text style={styles.linkText}>[Terms & Conditions]</Text> & <Text style={styles.linkText}>[Privacy Policy]</Text>.
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </>
        )}

        {errors.general && (
          <View style={styles.generalErrorContainer}>
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={isSignInMode ? handleLogin : handleCreateAccount}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading
              ? isSignInMode ? 'Connexion...' : 'Création du compte...'
              : isSignInMode ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>or continue with</Text>
          <View style={styles.separatorLine} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <SocialButton iconName="logo-google" provider="google" />
          <SocialButton iconName="logo-facebook" provider="facebook" />
          <SocialButton iconName="logo-apple" provider="apple" />
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {isSignInMode ? "Don't have an account?" : 'Already Have An Account?'}
          </Text>
          <TouchableOpacity onPress={() => { setErrors({}); setIsSignInMode(!isSignInMode); }}>
            <Text style={styles.signInLink}>{isSignInMode ? 'Register' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

/**
/**
 * Composant pour les boutons de connexion sociale
 */
type SocialButtonProps = {
  iconName: string;
  provider: string;
};

const SocialButton: React.FC<SocialButtonProps> = ({ iconName }) => (
  <TouchableOpacity style={styles.socialButton}>
    <Ionicons name={iconName as any} size={28} color="#FFF" />
  </TouchableOpacity>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fond noir
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 50, // Espace pour le bas
  },
  backButton: {
    padding: 15,
    paddingLeft: 25,
    alignSelf: 'flex-start',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
    marginTop: 10,
    paddingLeft: 10,
  },
  
  // FORMULAIRE
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E', // Fond des champs plus clair que le fond de l'écran
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
   input: {
     flex: 1,
     color: '#FFF',
     fontSize: 16,
   },
   inputError: {
     borderWidth: 1,
     borderColor: '#FF3B30',
   },
   errorText: {
     color: '#FF3B30',
     fontSize: 12,
     marginTop: 5,
     marginLeft: 10,
   },
   visibilityToggle: {
     padding: 5,
   },
  
  // FORCE DU MOT DE PASSE
  passwordStrengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 10,
  },
  passwordStrengthText: {
    color: '#FFF',
    fontSize: 14,
  },
  strengthBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E1E1E',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 4,
  },
  strengthBar_Weak: {
    width: '33%',
    backgroundColor: '#FF3B30', // Rouge
  },
  strengthBar_Good: {
    width: '66%',
    backgroundColor: '#FFCC00', // Jaune
  },
  strengthBar_Great: {
    width: '100%',
    backgroundColor: '#4CD964', // Vert
  },

  // CHECKBOX
  checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 30,
      paddingLeft: 10,
  },
  checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#FFF',
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
  },
   checkboxActive: {
     backgroundColor: '#936AFE', // Violet principal
     borderColor: '#936AFE',
   },
   checkboxError: {
     borderColor: '#FF3B30',
   },
   checkboxLabel: {
     color: '#FFF',
     fontSize: 14,
     flexShrink: 1, // Permet au texte de s'adapter
   },
  linkText: {
      color: '#936AFE', // Violet pour les liens
      fontWeight: '600',
  },
  
  // BOUTON PRINCIPAL
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#936AFE', // Violet principal
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
   buttonDisabled: {
     opacity: 0.5,
   },
   loadingContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   generalErrorContainer: {
     backgroundColor: 'rgba(255, 59, 48, 0.1)',
     padding: 12,
     borderRadius: 8,
     marginBottom: 20,
   },
   generalErrorText: {
     color: '#FF3B30',
     fontSize: 14,
     textAlign: 'center',
   },
  
  // SÉPARATEUR
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 35,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  separatorText: {
    width: width * 0.4,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },

  // CONNEXION SOCIALE
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  socialButton: {
    padding: 8,
  },

  // PIED DE PAGE
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 16,
    marginRight: 5,
  },
  signInLink: {
    color: '#936AFE',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default LoginScreen;