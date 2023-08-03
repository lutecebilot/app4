import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { FIREBASE_APP } from '../../firebaseconfig';

const Deplace = () => {
  const handleButtonPress = async () => {
    try {
      const db = getFirestore(FIREBASE_APP);

      // Récupérer les documents de la collection source (Référence)
      const referenceCollection = collection(db, 'Référence');
      const querySnapshot = await getDocs(referenceCollection);

      // Parcourir chaque document récupéré
      querySnapshot.forEach(async (document) => {
        // Créer une référence vers le document dans la collection cible (Pays/Italie/JetLog)
        const targetCollection = collection(db, 'Pays', 'Italie', 'JetLog');
        const targetDocRef = doc(targetCollection, document.id);

        // Copier les données du document de la collection source vers la collection cible
        await setDoc(targetDocRef, document.data());

        // Supprimer le document de la collection source
        await deleteDoc(document.ref);

        console.log('Le document a été déplacé avec succès.');
      });
    } catch (error) {
      console.error('Erreur lors du déplacement des documents :', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
        <Text style={styles.buttonText}>Déplacer </Text>
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

export default Deplace;
