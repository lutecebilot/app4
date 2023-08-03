import 'firebase/firestore';
import { FIREBASE_DATABASE } from '../../firebaseconfig';
import { doc, setDoc } from 'firebase/firestore';
import firebase from 'firebase/compat';

// Votre liste de noms de collections


// Fonction pour ajouter chaque collection à la section "Pays/Italie"
async function ajouterCollections(ref) {

  // Référence à la base de données Firestore de Firebase
  const db = FIREBASE_DATABASE;
  const date=new firebase.firestore.Timestamp(null,null);
    await setDoc(doc(db,"Pays","Italie","JetLogEffectif",ref), {
      StockComplet: 0,
      Réservé: 0,
      StockIncomplet: 0,
      ref: ref,
    });
    await setDoc(doc(db,"Pays","Italie","JetLogEffectif",ref,"id","NULL"), {
      StockComplet: false,
      Réservé: false,
      StockIncomplet: false,
      Date_entrée: firebase.firestore.Timestamp.now(),
      Date_sortie: 'Pas_encore' ,
      ref: "NULL",
      id_entrée: 'Pas_encore',
      id_sortie: 'Pas_encore',
      Description: 'Ecrire ce qui a été prélevé',
    });
    console.log(`Collection ${ref} ajoutée avec succès.`);


  
}

export default ajouterCollections;