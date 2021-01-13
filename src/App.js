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

  /** Basic Ranking List with changeable Rankings */
  class RankingList extends React.Component {
    /** Constructor for the Ranked List, loads data. */
    constructor(props) {
      super(props);
      
      this.state = {
        items: props.items,
        userEmail: props.userEmail,
        draggingOn: false,
      }
      
      this.storeRef = React.createRef();
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
        }).then(alert('Saved!'))
    }

    /** Renders the ranked list in order of the saved data. */
    render() {
      
      const renderedItems = [];
      const items = this.state.items;

      for (const [index, value] of items.entries()) {
        renderedItems.push(<RankedItem 
          index = {index}
          key = {'item' + index}
          item = {value}
          list = {this}
          listName = {this.props.listName}
        />)
      }

      return (
        <div>
          <h4>{this.props.listDisplayName}</h4>
          
          <SortableComponent items={this.state.items} list={this} />

          {/* <ol>
            {renderedItems}
          </ol> */}
          <button id='add' className='btn btn-info' onClick={() => this.handleAdd()}>Add Item</button>
          <button id='save' className='btn btn-secondary' onClick={() => this.handleSave()}>Save List</button>
        </div>
      )
    }
  }

  //============Drag and Drop Functionality============

  const DragHandle = sortableHandle(() => <span>:::</span>);
  const SortableItem = SortableElement(({value}) => 
    <li class="sortable">
      <DragHandle />
      &nbsp;&nbsp;{value}
    </li>);
 
  const SortableList = SortableContainer(({items}) => {
    return (
      <ol>
        {items.map((value, index) => (
          <SortableItem key={`item-${value}`} index={index} value={value} />
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
      this.props.list.setState(({items}) => ({
        items: this.state.items,
      }));
    };
    render() {
      return <SortableList items={this.state.items} onSortEnd={this.onSortEnd} useDragHandle/>;
    }
  }

  /** Handles the input for changing the rank of an item. */
  class RankedItem extends React.Component {

    /** Constructor for the input field and text of each list item. */
    constructor(props) {
      super(props);
      this.state = {
        value: '',
        itemNum: props.index,
        key: props.listName + props.index,
      };
  
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    /** Handles the input of text in the input secton of the list item. */
    handleChange(event) {
      const val = event.target.value;
      var intVal = parseInt(val, 10);
      if (isNaN(intVal) && val !== '') {
        return
      }
      if (val === '') {
        this.setState({value: val})
      } else {
        this.setState({value: intVal});
      }
    }
  
    /** Handles the event when the user submits an updated ranking for an item/ */
    handleSubmit(event) {
      event.preventDefault();
      rankChange(this.props.list, this.state.itemNum, this.state.value);
      this.setState({value: ''});
      this.props.list.forceUpdate();
    }

    /** Handles the removal of an item. */
    handleRemove(index) {
      let list = this.props.list;
      console.log(index);
      console.log(list.state.items);
      list.state.items.splice(index, 1)
      list.forceUpdate();
    }
  
    /** Renders the ranked item on the screen */
    render() {

      // let list = this.props.list;

      // // var dragSrcID = null;

      // function getListItem(eventTarget) {
      //   let listItem = eventTarget;
      //   listItem = listItem.closest('li');

      //   return listItem
      // }
      
      // function handleDragStart(e) {

      //   const style = e.target.style;
      //   style.opacity = '0.4';
      //   style.backgroundColor = 'lightblue';
      //   style.border = '3px solid darkcyan';
      //   style.borderRadius = '10px';
        
      //   dragSrcID = e.target.id;
      //   dragSrcClass = e.target.className;
  
      //   e.dataTransfer.effectAllowed = 'move';
      //   e.dataTransfer.setData('text/html', e.target.innerHTML);
      // }
  
      // function handleDragOver(e) {
      //   if (e.preventDefault) {
      //     e.preventDefault();
      //   }

      //   const listItem = getListItem(e.target);

      //   if (listItem) {
      //     const style = listItem.style;
      //     style.opacity = '.'
      //     style.borderTop = '3px solid darkcyan';
      //     e.dataTransfer.dropEffect = 'move';
      //   }
        
        
      //   return false;
      // }
  
      // function handleDragEnter(e) {
      //   const listItem = getListItem(e.target);

      //   if (listItem) {
      //     listItem.classList.add('over');
      //   }
      // }
  
      // function handleDragLeave(e) {
        
      //   const listItem = getListItem(e.target);

      //   if (listItem) {
      //     listItem.classList.remove('over');
      //     const style = listItem.style;
      //     style.borderTop = 'none';
      //   }
      // }
  
      // function handleDrop(e) {

      //   if (e.stopPropagation) {
      //     e.stopPropagation(); // stops the browser from redirecting.
      //   }
        
      //   const listItem = getListItem(e.target);

      //   if (listItem) {
      //     const style = listItem.style;
      //     style.opacity = '.'
      //     style.borderTop = 'none';
      //   }
        
      //   console.log(dragSrcClass);
      //   console.log(dragSrcID);
      //   console.log(listItem.id);
      //   console.log(listItem.className);
      //   if (dragSrcID !== listItem.id && dragSrcClass === listItem.className) {
      //     let movedItem = list.state.items.splice(dragSrcID, 1)[0];
      //     list.state.items.splice(e.target.id, 0, movedItem);
      //     list.forceUpdate();
      //   }
        
      //   return false;
      // }
  
      // function handleDragEnd(e) {
        
      //   const style = e.target.style;
      //   style.opacity = '1';
      //   style.backgroundColor = 'unset';
      //   style.border= 'none';
      //   style.borderTop = 'none';
      //   // console.log(this.innerHTML);
        
      //   items.forEach(function (item) {
      //     item.classList.remove('over');
      //   });
      // }
      
      // let items = document.querySelectorAll('.item');

      return (
        <li key={this.state.key} id={this.state.itemNum} className={this.props.listName}
        draggable = 'true'>
          <form onSubmit={this.handleSubmit} id={this.state.itemNum} className={this.props.listName}>
            <label>
              <input type='text' className='form-control' value={this.state.value} onChange={this.handleChange} />
            </label>
            <label className={this.props.listName} id={this.state.itemNum}>&nbsp;&nbsp;{this.props.item}&nbsp;&nbsp;</label>
            <input type='button' className='btn btn-light' onClick={() => this.handleRemove(this.state.itemNum)} value='Remove Item' />
          </form>
        </li>
      );
    }
  }

  /** Function that changes the order of the list items. */
  function rankChange(list, itemNum, destNum) {
    
    let items = list.state.items;

    if (destNum >= items.length) {
      destNum = items.length;
    }

    destNum -= 1;

    const savedItem = items[itemNum];
    items.splice(itemNum, 1);

    items.splice(destNum, 0, savedItem);

    list.state.items = items;

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
        <img src={props.photoURL} alt='Profile'/><br /><br />
        <p className='user-info'>Name: {props.firstName}</p>
        <p className='user-info'>Number of Rankings: {props.numRankings}</p>
      </div>
    )
  }