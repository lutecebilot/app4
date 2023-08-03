import { StyleSheet, Text, TextInput, View, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
/*import { useNavigation } from '@react-navigation/native';*/
import { FIREBASE_APP,FIREBASE_AUTH  } from '../../firebaseconfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  /*const navigation = useNavigation();*/

  const handleLogin = async () => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;
      console.log('Logged in with:', user.email);
      setEmail('');
      setPassword('');
      navigation.navigate('Main');
    } catch (error) {
      console.log(error);
      alert('E-mail o password non validi');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const userCredential = await createUserWithEmailAndPassword(auth,trimmedEmail, password);
      const user = userCredential.user;
      console.log('Registered with:', user.email);
      setEmail('');
      setPassword('');
      const db = getFirestore(FIREBASE_APP);
      const userDocRef = doc(db, 'Utilisateur', user.uid);
      await setDoc(userDocRef, {
        pays: 'Italie',
        entrepot: 'JetLog',
        statut: 'Utilisateur',
      });
      navigation.navigate('Main');
    } catch (error) {
      console.log(error);
      alert('Errore durante la creazione dell\'account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={email}
        style={styles.input}
        placeholder='E-mail'
        autoCapitalize='none'
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        secureTextEntry={true}
        value={password}
        style={styles.input}
        placeholder='Password'
        autoCapitalize='none'
        onChangeText={(text) => setPassword(text)}
      />
      {loading ? (
        <ActivityIndicator size="large" color='#0000ff' />
      ) : (
        <View>
          <TouchableOpacity onPress={handleLogin} style={[styles.button, styles.loginButton]}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignUp} style={[styles.button, styles.signUpButton]}>
            <Text style={styles.buttonText}>Iscrizione</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    width: Dimensions.get('window').width - 40,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#61c6dd',
  },
  signUpButton: {
    backgroundColor: '#61c6dd',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default Login;