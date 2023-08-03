import * as React from 'react';
import { Button , StyleSheet, View} from 'react-native';
import XLSX from 'xlsx';
import firebase from 'firebase/compat/app';


const ExcelFilesButton = () => {
  const handlePress = async () => {
      function getFormattedDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Les mois vont de 0 à 11, d'où l'ajout de 1
        const year = String(today.getFullYear()).slice(-2); // Récupère les deux derniers chiffres de l'année
      
        return `${day}.${month}.${year}`;
      }
      
      // Utilisation de la fonction pour obtenir la date du jour au format JJ.MM.AA
      const formattedDate = getFormattedDate();
      const storageRef = firebase.storage().ref(`bons_de_livraison/${formattedDate}`); // Chemin vers le dossier contenant les fichiers Excel
      const files = await storageRef.listAll();// Liste tous les fichiers dans le dossier
      const bonsDeLivraisonCollection = firebase.firestore().collection('Bons_de_livraison');

      // Parcourir les fichiers
      for (const file of files.items) {
        const fileUrl = await file.getDownloadURL(); // Obtient l'URL de téléchargement du fichier
        const response = await fetch(fileUrl);
        const fileContents = await response.text();// Lit le contenu du fichier en tant que chaîne binaire
        const workbook = XLSX.read(fileContents, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Obtient la première feuille du classeur
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Convertit la feuille en format JSON
        console.log(excelData)
        if (excelData.length > 0) {
          const firstCellValue = excelData[11][7]; // Récupère la valeur de la première case de la première colonne
          const existingDoc = await bonsDeLivraisonCollection.where('ref_no', '==', firstCellValue).get();
          
          // Utilisation de la fonction pour obtenir la date du jour au format JJ.MM.AA
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
  },
  buttonBackground: {
    backgroundColor: '#d0d0d0', // Set the background color for the button
    borderRadius: 5,
    padding: 10,
  },
});

export default ExcelFilesButton;