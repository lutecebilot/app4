import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity,Image, Alert } from "react-native";
import { FIREBASE_AUTH, FIREBASE_DATABASE, signOutUser } from "../../firebaseconfig";
/*import { useNavigation } from "@react-navigation/native";*/
import firebase from "firebase/compat";
import { doc, getDoc } from "firebase/firestore";

const PageLogout = () => {
  const [username, setUsername] = useState("");
  const [entrepot, setEntrepot] = useState("");
  const [mail, setMail] = useState("");
  /*const navigation = useNavigation();*/
  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    const loadUserData = async () => {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        const userDisplayName = user.displayName;
        setUsername(userDisplayName);
        const userDocSnapshot = await getDoc(doc(FIREBASE_DATABASE, 'Utilisateur', user.uid));
        const userEntrepot = userDocSnapshot.data().entrepot;
        setMail(user.email);
        setEntrepot(userEntrepot);
      }
    };

    loadUserData();
  }, []);

  const handlePasswordReset = () => {
    if (user) {
      firebase
        .auth()
        .sendPasswordResetEmail(user.email)
        .then(() => {
          Alert.alert("Reimpostazione della password! Ti è appena stata inviata un'e-mail.");
        })
        .catch((error) => {
          // Alert.alert("Errore durante il ripristino della password:", error);
          console.log("Errore durante il ripristino della password:", error);

        });
    }
  };

  const handleLogout = () => {
    signOutUser()
      .then(() => {
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <View style={styles.pageContainer}>
      <View>
          <Image source={require('../../assets/jetlog.png')} style={styles.image} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.infoTitle}>Le mie informazioni</Text>
        <Text style={styles.infoText}>Il mio magazzino : {entrepot}</Text>
        <Text style={styles.infoText}>Il mio indirizzo email : {mail}</Text>
        <TouchableOpacity onPress={handlePasswordReset} style={styles.button}>
          <Text style={styles.buttonText}>Resetta la password</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Disconnettersi</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 20,
    top:-100,

  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#61c6dd",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#ff0000",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    top:-100,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  image: {
    width: 200, // adjust the width as needed
    height: 200, // adjust the height as needed
    resizeMode: 'contain', // adjust the resizeMode as needed
    top:-100,
  },
});

export default PageLogout;