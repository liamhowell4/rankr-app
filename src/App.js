import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';
import RankingList from './rank-engine/RankingList.js'

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';

firebase.initializeApp({
  apiKey: 'AIzaSyBblldZeCvHZy5fDfTzxgTWPYoT568KCzQ',
  authDomain: 'rankr-15271.firebaseapp.com',
  databaseURL: 'https://rankr-15271-default-rtdb.firebaseio.com',
  projectId: 'rankr-15271',
  storageBucket: 'rankr-15271.appspot.com',
  messagingSenderId: '548038535110',
  appId: '1:548038535110:web:d0855f7184b33be75474c7',
  measurementId: 'G-3WXSLX7RJV'
})

const auth = firebase.auth();
const db = firebase.firestore();
export const userRef = db.collection('users2');
export const listRef = db.collection('lists');
export let existingListNames = new Set();

/** async function that gets the data for all lists that have been created. */
async function getListsGlobal() {
  const snapshot = await listRef.doc('GLOBAL').get()
  return snapshot.data();
}

/** Gets the data for the already created list listName */
export async function getExistingList(listName) {
  const snapshot = await listRef.doc(listName).get()
  return snapshot.data();
}
  
/** The rankr App itself */
export default function App() {

    const [user] = useAuthState(auth);

    getListsGlobal().then(function(results) {
      existingListNames = new Set(results.allLists);
    })

    return (
      <div className='App'>
      
        <div className='row' id='user-info-rankings'>

          {user ? <User user={auth.currentUser} /> : <SignIn />}
        
        </div>

        <div id='action-buttons'>

          {user ? <SignOut /> : <p></p>}

        </div>

      </div>
    );
  
}

/** Definition of a User, the component that contains the RankingLists */
class User extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      firstName: props.user.displayName.split(' ')[0],
      name: props.user.displayName,
      email: props.user.email,
      photoUrl: props.user.photoURL,
      uid: props.user.uid,
      loaded: false,
      rankingData: [],
      renderedItems: [],
      lists: new Set(),
      userExists: true,
      addingList: false
    }

    this.getUserRankings();
  }

  /** 
   * Async function to get the rankings data for a specific user from firestore, 
   * allows for an 'await' call. Returns a promise with an array of arrays. Each inner 
   * array has the id of each list and the data (rankings, name, type) as its two 
   * elements.
   */
  async getUserRankingsFromFS(ref) {
    const snapshot = await ref.get()
    return snapshot.docs.map(doc => [doc.id, doc.data()]);
  }

  /** async function that gets the basic data for an individual user. */
  async getUserLists(ref) {
    const snapshot = await ref.get()
    return snapshot.data();
  }

  /** Fetches the ranking data from Firestore. */
  getUserRankings() {

    let thisUser = this;

    // Creates a new document is the user doesn't exist, then stops the loading of data
    userRef.doc(this.state.email).get()
    .then(function(doc) {
      if(!doc.exists) {
        userRef.doc(thisUser.state.email).set({name: thisUser.state.name, userLists: new Set()})
        thisUser.setState({userExists: false, loaded: true})
        return;
      }
    });

    // Sets reference variables for abstractions in this method
    let userDoc = userRef.doc(this.state.email)
    let rankRef = userDoc.collection('rankings');

    // Loads in the names of the lists that each user has ranked.
    this.getUserLists(userDoc).then(function(results) {
      if (!results) {
        return
      }
      thisUser.setState({lists: new Set(results.userLists)});
    })

    // Loads the rankings that the User has created, in the form of a map of 
    // the list name and then the list info.
    this.getUserRankingsFromFS(rankRef).then(function(results) {
      thisUser.setState({rankingData: results, loaded: true});
      thisUser.renderLists();
    });
  }

  /** Creates "renderedItems", the array of RankingList elements, to be rendered. */
  renderLists() {
    const renderedItems = [];

    if (!this.state.rankingData.length) {
      this.addList();
    }

    for (let i = 0; i < this.state.rankingData.length; i++) {

      const ranking = this.state.rankingData[i];
      
      renderedItems.push(
        <div>
          <RankingList
            items={ranking[1]['items']}
            listDisplayName = {ranking[1]['listDisplayName']}
            listName = {ranking[0]}
            type = {ranking[1]['type']}
            user={this}
            owner={ranking[1]['owner']}
          />
        </div>
      )
    }

    this.setState({renderedItems: renderedItems});
  }

  /** Allows the user who already has at least one list to build a new one. */
  addList() {

    this.setState({addingList: true})

    let rd = this.state.rankingData;
    
    let newList = ['', {
      'listDisplayName': '',
      'items': [],
      'type': '' 
    }]

    rd.push(newList);

    this.renderLists();
  }

  /** Renders the User Component, with options for whether the data is
   * loaded in, if the user exists.
   */
  render() {

    const loaded = this.state.loaded;

    return (loaded ? 
      <>
      
        <section id='user-info' className='col-md-2'>

          {loaded ? <UserProfile firstName={this.state.firstName} 
            numRankings={this.state.rankingData.length} 
            photoURL={this.state.photoUrl}
          /> : null}

        </section>

        <section id='rankings' className='col-md-10'>

          {loaded ? this.state.renderedItems : null }

          <br />

          {this.state.addingList ? null: <button className='btn btn-info list-edit' onClick={() => this.addList()}>
          Add List</button>}

        </section>

      </>
      : <p>Loading Element...</p>)
  }
}

// ============Sign in and Users===========



/** Sign in Button Functionality */
function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    /** @source FIREBASE API REFERENCE */ 
    firebase.auth()
      .signInWithPopup(provider)
  }

  return (
    <button className='btn btn-primary' onClick={signInWithGoogle}>Sign in with Google</button>
  )

}

/** Sign Out Button Functionality */
function SignOut() {
  // globalItems = DEFAULT_ITEMS;
  return auth.currentUser && (
    <button className='btn btn-danger' onClick={() => auth.signOut()}>Sign Out</button>
  )
}

/** User Identifier */
function UserProfile(props) {
  return (
    <div id='user-info'>
      <img src={props.photoURL} alt='Profile' id='profilePic'/><br /><br />
      <p className='user-info'>Name: {props.firstName}</p>
      <p className='user-info'>Number of Rankings: {props.numRankings}</p>
    </div>
  )
}