import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import {SortableContainer, SortableElement, sortableHandle} from 'react-sortable-hoc';
import arrayMove from 'array-move';

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
  const userRef = db.collection('users');
  // var dragSrcID = null;
  // var dragSrcClass = null;

  /** Definition of a User */
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
        userExists: true
        // dataNames: [],
      }

      this.getUserRankings();
    }

    async getMarker(ref) {
      const snapshot = await ref.get()
      return snapshot.docs.map(doc => [doc.id, doc.data()]);
    }

    /** Customizes the rankings to those picked by the user. */
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

    renderLists() {
      const renderedItems = [];

      for (let i = 0; i < this.state.rankingData.length; i++) {

        const ranking = this.state.rankingData[i];

        // ranking['listName'] = this.state.dataNames[i];
        
        renderedItems.push(
          <div className='rankingList'>
            <RankingList
              items={ranking[1]['items']}
              listDisplayName = {ranking[1]['displayName']}
              listName = {ranking[0]}
              userEmail = {this.state.email}
              type = {ranking[1]['type']}
            />
          </div>
        )
      }

      this.setState({renderedItems: renderedItems});
    }

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

            {this.state.rankingData.length ? (loaded ? this.state.renderedItems : null) : <NewList user={this} />}<br />
            <button id='add' className='btn btn-info' onClick={(e) => e.preventDefault()}>Add List</button>

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
        editmode: false,
      }
      
      this.handleRemove = this.handleRemove.bind(this)
    }

    handleRemove(i) {
      let newItems = this.state.items;
      newItems.splice(i, 1);

      this.setState({items: newItems})
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
    }

    /** Saves the updated rankings to the user's profile. */
    handleSave() {
      let rankRef = userRef.doc(this.state.userEmail).collection('rankings');
      rankRef.doc(this.props.listName)
        .set({
          displayName: this.props.listDisplayName,
          items: this.state.items,
          type: this.props.type
        })
      this.setState({editMode: false});
    }

    /** Saves the updated rankings to the user's profile. */
    turnOnEditing() {
      this.setState({editMode: true});
    }

    /** Renders the ranked list in order of the saved data. */
    render() {
      
      const items = this.state.items;
      let editMode = this.state.editMode;

      let itemsList = []

      for (let i = 0; i < items.length; i += 1) {
        itemsList.push(
        <li key={i}>
          {items[i]}
        </li>)
      }

      return (
        <div>
          <h4>{this.props.listDisplayName}</h4>
          
          {editMode ? 
          <SortableComponent items={this.state.items} list={this} handleRemove={(i) => this.handleRemove(i)}/> : 
          <ol>{itemsList}</ol>
          }
          <button id='add' className='btn btn-info' onClick={() => this.handleAdd()}>Add Item</button>
          {editMode ?
          <button id='editSave' className='btn btn-secondary' onClick={() => this.handleSave()}>Save List</button> :
          <button id='editSave' className='btn btn-secondary' onClick={() => this.turnOnEditing()}>Edit List</button>
          }
        </div>
      )
    }
  }

  //============Drag and Drop Functionality============

  const DragHandle = sortableHandle(() => <img src='https://cdn2.iconfinder.com/data/icons/font-awesome/1792/reorder-512.png' alt=':::' className='sortable'/>);
  const SortableItem = SortableElement(({value}) => 
    <li className="sortable">
      <DragHandle />
      &nbsp;&nbsp;{value}
      {/* <button onClick={handleRemove(list,index)}>Hi</button> */}
    </li>);
 
  const SortableList = SortableContainer(({items, list}) => {
    return (
      <ol>
        {items.map((value, index) => (
          <SortableItem key={`item-${value}`} id={console.log(index)} list={list} index={index} value={value} />
        ))}
      </ol>
    );
  });
  
  class SortableComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        items: props.items,
      };
    }

    onSortEnd = ({oldIndex, newIndex}) => {
      this.setState(({items}) => ({
        items: arrayMove(items, oldIndex, newIndex),
      }));
      this.props.list.setState({
        items: this.state.items});
    };
    render() {
      return <SortableList items={this.state.items} list={this.props.list} onSortEnd={this.onSortEnd} useDragHandle/>;
    }
  }

  /** Function that changes the order of the list items. */
  function handleRemove(list, itemNum) {
    
    let newItems = list.state.items;
    newItems.splice(itemNum, 1);

    list.setState({items: newItems});

  }

  class NewList extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        user: props.user,
        userInfo: props.user.props.user,
        entries: 3,
        displayName: '',
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

      const thisUser = this.state.user;
      const userDoc = userRef.doc(this.state.userInfo.email);
      userDoc.get();
      let fixedItems = this.state.items;

      if (!this.state.items.length || this.state.type === '' 
      || this.state.listName === '' || this.state.displayName === '') {
        alert('FAILURE');
        return;
      }

      
      for (let i = 0; i < fixedItems.length; i++) {
        if (fixedItems[i] === null) {
          fixedItems.splice(i, 1);
        }
      }

      let newRankingData = thisUser.state.rankingData;
      newRankingData.push(this.state.listName);
      thisUser.setState({rankingData: newRankingData});

      userDoc.update({
        userLists: thisUser.state.rankingData
      })
      
      userDoc.collection('rankings').doc(this.state.listName).set({
        type: this.state.type,
        items: this.state.items,
        displayName: this.state.displayName
      });
    }

    /** Handles the input of text in the title secton of the form */
    getTitle(event) {
      const val = event.target.value;
      this.setState({displayName: val});
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
        <div className='rankingList'>
          <form onSubmit={this.handleSubmit} id='newUserForm' autoComplete='new-password' autoCorrect='off' spellCheck='off'>
            <label id='title'>TITLE:&nbsp;</label>
            <label>
              <input type='text' className='form-control' id='displayName' onChange={this.getTitle} autoComplete='off' />
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

            <input type='submit' className='btn btn-light' value='Save List' />
          </form>
        </div>
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