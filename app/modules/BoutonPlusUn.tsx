import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { getFirestore, doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { FIREBASE_APP,FIREBASE_AUTH,FIREBASE_DATABASE } from '../../firebaseconfig';

const BoutonPlusUn = () => {
  const handleButtonPress = async () => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      const userId = user!.uid;
      const userDocRef = doc(FIREBASE_DATABASE, 'Utilisateur', userId);
      const userDocSnapshot = await getDoc(userDocRef);
      const ville = userDocSnapshot.data().pays;
      const lieu = userDocSnapshot.data().entrepot;

      // Mettre à jour l'attribut 'Réservé' de l'article correspondant
      const referenceCollection = collection(FIREBASE_DATABASE, 'Pays', ville, lieu);
      const querySnapshot = await getDocs(referenceCollection);

      querySnapshot.forEach(async (doc) => {
        if (doc.data().ref === '33165-1') {
          const referenceRef = doc.ref;
          await updateDoc(referenceRef, { Réservé: doc.data().Réservé + 1 });
          console.log('L\'attribut "Réservé" de l\'article a été mis à jour avec succès.');
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'attribut "Réservé" de l\'article :', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
        <Text style={styles.buttonText}>Bouton</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'blue',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BoutonPlusUn;
