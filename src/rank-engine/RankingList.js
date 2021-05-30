import React from 'react';
import '../index.css';
import { existingListNames, listRef, userRef } from '../App.js';
import NewList from './NewList.js';
import SortableComponent from './Sortable.js';


//===============The List Component===========================

/** Basic Ranking List with changeable Rankings */
export default class RankingList extends React.Component {
  /** Constructor for the Ranked List, loads data. */
  constructor(props) {
    super(props);

    let editMode = true;

    if (!props.editMode) {
      editMode = false;
    }

    this.state = {
      items: props.items,
      user: props.user,
      userEmail: props.user.state.email,
      listName: props.listName,
      listDisplayName: props.listDisplayName,
      type: props.type,
      editMode: editMode,
      createMode: false,
      owner: props.owner,
    }

    this.handleAdd = this.handleAdd.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.turnOnEditing = this.turnOnEditing.bind(this);
    this.getTitle = this.getTitle.bind(this);
    this.handleListDelete = this.handleListDelete.bind(this);

    this.sorter=React.createRef();
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

    listRef.doc(this.state.listName).update({
      items: newItems
    })

    this.handleSave(false);
  }

  /** Handles the input of text in the title secton of the form */
  getTitle(event) {
    const val = event.target.value;
    this.setState({listDisplayName: val});
  }

  /** Saves the updated rankings to the user's document in Firestore. */
  handleSave(turnOffEditing = true) {
    const thisUser = userRef.doc(this.state.userEmail);
    const rankRef = thisUser.collection('rankings');
    const thisRanking = rankRef.doc(this.state.listName);

    let thisUserLists = this.state.user.state.lists;
    thisUserLists.add(this.state.listName);

    thisRanking.set({
        listDisplayName: this.state.listDisplayName,
        items: this.state.items,
        type: this.state.type,
        owner: this.state.owner
      })
    thisUser.update({
      userLists: Array.from(thisUserLists),
    });
    
    if (this.state.editMode && turnOffEditing) {
      this.setState({editMode: false});
      this.state.user.setState({addingList: false});
    }
  }

  /** Switches between viewing and editing mode. */
  turnOnEditing() {
    this.setState({editMode: true})
  }

  handleListDelete() {
    if (window.confirm('Are you sure you want to delete this list? Page will reload')) {
      const thisUser = userRef.doc(this.state.userEmail);
      const rankRef = thisUser.collection('rankings');
      const thisRanking = rankRef.doc(this.state.listName);
      
      let thisUserLists = this.state.user.state.lists;
      thisUserLists.delete(this.state.listName);

      thisUser.update({
        userLists: Array.from(thisUserLists),
      });

      thisRanking.delete().then(() => {
        console.log("Document successfully deleted!");
      }).catch((error) => {
          console.error("Error removing document: ", error);
      });


      // REEXAMINE THIS, BECAUSE USERS COULD CREATE A NEW LIST WITH THE SAME LISTNAME, 
      // AND IF USERS HAVEN'T DELETED THE DEPRECATED LIST, THEY WILL NOT BE ABLE TO USE THE NEW LIST

      if (this.state.owner && window.confirm(
        'You are the owner of this list. Would you like to disable future users from ranking this list? (This will not affect users who have already ranked your list)'
      )) {
        listRef.delete(this.state.listName);
        existingListNames.delete(this.state.listName);
        listRef.doc('GLOBAL').update({
          allLists: Array.from(existingListNames)
        })
      }

      window.location.reload();
    }
  }

  componentDidUpdate() {
    if (!this.state.owner && this.state.editMode) {
      document.getElementById('add-item').disabled = true;
      document.getElementById('add-item').innerHTML = 'Add Item (Creator Only)';
    }
  }

  /** Renders the ranked list in order of the saved data. */
  render() {
    
    const items = this.state.items;
    let editMode = this.state.editMode;
    let newListMode = this.state.createMode;
    
    if (!items.length) {
      newListMode = true;
    }

    let itemsList = []

    if (!newListMode) {
      for (let i = 0; i < items.length; i += 1) {
        itemsList.push(
        <li key={i}>
          {items[i]}
        </li>)
      }

      if (!editMode) {
        this.handleSave();
      }
    }

    return (
      <>
        {newListMode ? 
        <NewList list={this} user={this.state.user}/> :
        <div className='ranking-list'>
          {editMode ? 
          <>
            <label>
              <input type='text' className='form-control' onChange={this.getTitle} id='listDisplayName' 
              autoComplete='off' defaultValue={this.state.listDisplayName}/>
            </label>
            <SortableComponent items={this.state.items} list={this} owner={this.state.owner} />
            <button className='btn btn-secondary list-edit' onClick={this.handleSave}>Save List</button>
            <button id='add-item' className='btn btn-info list-edit' onClick={this.handleAdd}>Add Item</button>
            <button className='btn btn-danger list-edit' onClick={this.handleListDelete}>Delete List</button>
          </>
          :
          <> 
            <h4>{this.state.listDisplayName}</h4>
            <ol>{itemsList}</ol>
            <button className='btn btn-secondary list-edit' onClick={this.turnOnEditing}>Edit List</button>
            {/* {newListMode ? null : <button id='add' className='btn btn-info' 
            onClick={this.handleAdd}>Add Item</button>} */}
          </>
          }
        </div>
        }
        
      </>
    )
  }
}