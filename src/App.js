import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';
import SortableComponent from './Sortable.js';

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
  
  /** The rankr App itself */
  export default function App() {

    const [user] = useAuthState(auth);

    return (
      <div className='App'>
      
      <div className='row' id='user-info-rankings'>

        {user ? <User user={auth.currentUser} /> : <SignIn></SignIn>}
      
      </div>

     <div id='action-buttons'>

        {user ? <SignOut /> : <p></p>}

      </div>

      </div>
    );
  }

  // =========Rank Engine=====================

  const db = firebase.firestore();
  const userRef = db.collection('users2');
  // var dragSrcID = null;
  // var dragSrcClass = null;

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
        userExists: true,
        adding: false
      }

      this.getUserRankings();
    }

    /** async function to get the data from firestor, allows for an 'await' call. */
    async getMarker(ref) {
      const snapshot = await ref.get()
      return snapshot.docs.map(doc => [doc.id, doc.data()]);
    }

    /** Fetches the ranking data from Firestore. */
    getUserRankings() {

      let thisUser = this;

      userRef.doc(this.state.email).get()
      .then(function(doc) {
        if(!doc.exists) {
          userRef.doc(thisUser.state.email).set({name: thisUser.state.name, userLists: []})
          thisUser.setState({userExists: false, loaded: true})
          return;
        }
      });

      let rankRef = userRef.doc(this.state.email).collection('rankings');

      this.getMarker(rankRef).then(function(results) {
        thisUser.setState({rankingData : results, loaded: true});
        thisUser.renderLists();
      });
    }

    /** Creates "renderedItems", the array of RankingList elements, to be rendered. */
    renderLists() {
      const renderedItems = [];

      for (let i = 0; i < this.state.rankingData.length; i++) {

        const ranking = this.state.rankingData[i];

        // ranking['listName'] = this.state.dataNames[i];
        
        renderedItems.push(
          <div className='rankingList'>
            <RankingList
              items={ranking[1]['items']}
              listDisplayName = {ranking[1]['listDisplayName']}
              listName = {ranking[0]}
              userEmail = {this.state.email}
              type = {ranking[1]['type']}
              user={this}
            />
          </div>
        )
      }

      this.setState({renderedItems: renderedItems});
    }

    /** Allows the user who already has at least one list to build a new one. */
    addList() {
      // let renIt = this.state.renderedItems;
      // renIt.push(<RankingList
      //   items={[]}
      //   listDisplayName = {''}
      //   listName = {''}
      //   userEmail = {this.state.email}
      //   type = {''}
      //   user={this}
      // />);
      // this.setState({renderedItems: renIt});
      // this.forceUpdate();
      console.log("In Progress");
    }

    /** Renders the User Component. */
    render() {

      const loaded = this.state.loaded;

      return (loaded ? 
        <>
        
          <section id='user-info' className='col-md-2'>

            {loaded ? <UserInfo firstName={this.state.firstName} 
              numRankings={this.state.rankingData.length} 
              photoURL={this.state.photoUrl}
            /> : null}

          </section>

          <section id='rankings' className='col-md-10'>

            {this.state.rankingData.length ? (loaded ? this.state.renderedItems : null) :
            
            <div className='rankingList'>
              <RankingList
                items={[]}
                listDisplayName = {''}
                listName = {''}
                userEmail = {this.state.email}
                type = {''}
                user={this}
              />
            </div>}<br />

            <button id='add' className='btn btn-info' onClick={() => this.addList()}>Add List</button>

          </section>

        </>
        : <p>Loading Element...</p>)
    }
  }

//===============The List Component===========================

  /** Basic Ranking List with changeable Rankings */
  class RankingList extends React.Component {
    /** Constructor for the Ranked List, loads data. */
    constructor(props) {
      super(props);

      this.state = {
        items: props.items,
        userEmail: props.userEmail,
        listName: props.listName,
        listDisplayName: props.listDisplayName,
        type: props.type,
        editmode: false,
        createMode: false,
      }
    }

    /** Uses a prompt to add an item to the end of the list */
    handleAdd() {
      let newItems = this.state.items;
      let newItem = prompt('What item would you like to add?');
      // this.draggingEngine(this, false);
      if (newItem !== '' && newItem !== null){
        newItems.push(newItem);
        this.setState({items: newItems, draggingOn: false});
      }

      this.handleSave();
    }

    /** Saves the updated rankings to the user's profile. */
    handleSave() {
      let rankRef = userRef.doc(this.state.userEmail).collection('rankings');
      console.log(this.state.listName);
      let thisDoc = rankRef.doc(this.state.listName);
      thisDoc.set({
          listDisplayName: this.state.listDisplayName,
          items: this.state.items,
          type: this.state.type
        })

      console.log(this.props.user);
      // userRef.doc(this.state.userEmail).update({
      //   userLists: this.props.user.state.rankingData});
      this.setState({editMode: false});
    }

    turnOnEditing() {
      this.setState({editMode: true})
    }

    /** Creates a new Ranked List from the New Item Component */

    /** Renders the ranked list in order of the saved data. */
    render() {
      
      const items = this.state.items;
      let editMode = this.state.editMode;
      let createMode = this.state.createMode;

      if (!items.length) {
        createMode = true;
      }

      let itemsList = []

      for (let i = 0; i < items.length; i += 1) {
        itemsList.push(
        <li key={i}>
          {items[i]}
        </li>)
      }

      return (
        <div>
          <h4>{this.state.listDisplayName}</h4>
          
          {createMode ? 
          <NewList list={this} user={this.props.user}/> :
          (editMode ? 
          <SortableComponent items={this.state.items} list={this} handleRemove={(i) => this.handleRemove(i)}/> : 
          <ol>{itemsList}</ol>
          )}
          <button id='add' className='btn btn-info' onClick={() => this.handleAdd()}>Add Item</button>
          {createMode ?
          <button id='editSave' className='btn btn-warning' onClick={() => this.handleCreate()}>Create List</button> :
          (editMode ?
          <button id='editSave' className='btn btn-secondary' onClick={() => this.handleSave()}>Save List</button> :
          <button id='editSave' className='btn btn-secondary' onClick={() => this.turnOnEditing()}>Edit List</button>
          )}
        </div>
      )
    }
  }

  class NewList extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        user: props.user,
        userInfo: props.user.props.user,
        entries: 3,
        listDisplayName: '',
        listName: '',
        type: '',
        items: [null, null, null],
        names: ['kanye', 'taylor', 'mac', 'beatles', 'marvel', 'beer', 'restaurants'],
        types: ['food', 'music', 'film']
      };
  
      this.getTitle = this.getTitle.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleRankSet = this.handleRankSet.bind(this);
      this.selectType = this.selectType.bind(this);
      this.selectListName = this.selectListName.bind(this);
      this.handleAddLine = this.handleAddLine.bind(this);
      this.handleRemoveLine = this.handleRemoveLine.bind(this);
    }

    /** Handles the event when the user submits an updated ranking for an item/ */
    handleSubmit(event) {
      event.preventDefault();

      this.props.list.setState({
        items: this.state.items,
        userEmail: this.state.userEmail,
        listName: this.state.listName,
        listDisplayName: this.state.listDisplayName,
        type: this.state.type,
      });

      console.log(this.props.list.state.listName);
      // this.props.list.handleSave();
    }

    /** Handles the input of text in the title secton of the form */
    getTitle(event) {
      const val = event.target.value;
      this.setState({listDisplayName: val});
    }

    /** Handles the rank setting of items put into the new list form. */
    handleRankSet(event) {
      const val = event.target.value;
      let newItems = this.state.items;
      newItems[event.target.id] = val;
      this.setState({items: newItems});
    }

    /** Sets the type of the list being made */
    selectType(event) {
      this.setState({type: event.target.value});
    }

    /** Sets the type of the list being made */
    selectListName(event) {
      this.setState({listName: event.target.value});
    }

    /** Allows the user to add a new Item to the Ranking */
    handleAddLine(event) {
      event.preventDefault();
      this.setState({entries: this.state.entries + 1})
    }

    /** Allows the user to add a new Item to the Ranking */
    handleRemoveLine(event) {
      event.preventDefault();
      this.setState({entries: this.state.entries - 1})
    }

    render() {
      let addOptions = [];
      let rankingOptions = [];
      let typeOptions = [];

      for (let i = 0; i < this.state.entries; i++) {
        addOptions.push(
        <>
          <label>
            <input type='text' className='form-control' id={i} onChange={this.handleRankSet} autoComplete='off' />
          </label><br />
        </>)
      }

      for (let i = 0; i < this.state.types.length; i++){
        typeOptions.push(<option>{this.state.types[i]}</option>)
      }

      for (let i = 0; i < this.state.names.length; i++){
        rankingOptions.push(<option>{this.state.names[i]}</option>)
      }

      return(
        <form id='newUserForm' autoComplete='new-password' autoCorrect='off' spellCheck='off'>
          <label id='title'>TITLE:&nbsp;</label>
          <label>
            <input type='text' className='form-control' id='listDisplayName' onChange={this.getTitle} autoComplete='off' />
          </label><br /><br />
          
          <label id='rankingAddHeader'>Ranked Items:</label><br />
          {addOptions}
          <button type="button" id="addLineButton" onClick={this.handleAddLine}>Add Line</button><label>&nbsp;|&nbsp;</label>
          <button type="button" id="removeLineButton" onClick={this.handleRemoveLine}>Remove Line</button><br /><br />


          <label>List Name (list the list's official username):&nbsp;</label>
          <label><select className='form-control' onChange={this.selectListName}>
            <option>--Select List Name--</option>
            {rankingOptions}
          </select></label><br />

          <label>List Category:&nbsp;</label>
          <label><select className='form-control' onChange={this.selectType}>
            <option>--Select List Name--</option>
            {typeOptions}
          </select></label><br />

          <button className='btn btn-light' onClick={this.handleSubmit}>Save List</button>
        </form>
      )
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
        // .then((result) => {
        //   /** @type {firebase.auth.OAuthCredential} */
        //   var credential = result.credential;

        //   // Gets a Google Access Token
        //   var token = credential.accessToken;
        //   // The signed-in user info.
        //   var user = result.user;
        //   // ...
        // }).catch((error) => {
        //   // Handle Errors here.
        //   var errorCode = error.code;
        //   var errorMessage = error.message;
        //   // The email of the user's account used.
        //   var email = error.email;
        //   // The firebase.auth.AuthCredential type that was used.
        //   var credential = error.credential;
        //   // ...
        // });
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
  function UserInfo(props) {
    return (
      <div id='user-info'>
        <img src={props.photoURL} alt='Profile' id='profilePic'/><br /><br />
        <p className='user-info'>Name: {props.firstName}</p>
        <p className='user-info'>Number of Rankings: {props.numRankings}</p>
      </div>
    )
  }