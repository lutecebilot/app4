import React from 'react';
import { Button, View, StyleSheet, Dimensions } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import Papa from 'papaparse';

const ExcelFilesButton_csv = () => {
  const handlePress = async () => {
    function getFormattedDate() {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = String(today.getFullYear()).slice(-2);

      return `${day}.${month}.${year}`;
    }

    const formattedDate = getFormattedDate();
    const storageRef = firebase.storage().ref(`bons_de_livraison/${formattedDate}`);
    const files = await storageRef.listAll();
    const bonsDeLivraisonCollection = firebase.firestore().collection('Bons_de_livraison');

    for (const file of files.items) {
      const fileUrl = await file.getDownloadURL();
        const response = await fetch(fileUrl);
        if (!response.ok) {
          console.error(`Failed to fetch the file (status ${response.status})`);
          continue; // Skip to the next file if fetching fails
        }
        // Read the file contents as text
        const fileContents = await response.text();
        // Parse the CSV data using papaparse
        const parsedData = Papa.parse(fileContents).data;

          const firstCellValue = parsedData[10][6];
          const existingDoc = await bonsDeLivraisonCollection.where('ref_no', '==', firstCellValue).get();

          if (existingDoc.empty) {
            await bonsDeLivraisonCollection.add({
              ref_no: firstCellValue,
              date_ajout: formattedDate,
              enregistre: false,
              access: `${fileUrl}`,
            });
          
            console.log(`Ajout du bon de livraison avec la référence "${firstCellValue}" effectué.`);
          } else {
            console.log(`Le bon de livraison avec la référence "${firstCellValue}" existe déjà.`);
          }
    }
  };

  return (
    <View style={styles.buttonContainer}>
      <View style={styles.buttonBackground}>
        <Button
          title="Ajouter les nouveaux bons de livraison"
          onPress={handlePress}
          color="#000" // Set the button color
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: Dimensions.get('window').width - 40,
  },
  buttonBackground: {
    backgroundColor: '#d0d0d0', // Set the background color for the button
    borderRadius: 5,
    padding: 10,
  },
});

export default ExcelFilesButton_csv;