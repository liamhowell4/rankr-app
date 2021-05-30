import React from 'react';
import '../index.css';
import { userRef } from '../App.js';
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
    }

    this.handleAdd = this.handleAdd.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.turnOnEditing = this.turnOnEditing.bind(this);
    this.getTitle = this.getTitle.bind(this);
    this.handleListDelete = this.handleListDelete.bind(this);
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

  /** Handles the input of text in the title secton of the form */
  getTitle(event) {
    const val = event.target.value;
    this.setState({listDisplayName: val});
  }

  /** Saves the updated rankings to the user's document in Firestore. */
  handleSave() {
    const thisUser = userRef.doc(this.state.userEmail);
    const rankRef = thisUser.collection('rankings');
    const thisRanking = rankRef.doc(this.state.listName);

    let thisUserLists = this.state.user.state.lists;
    thisUserLists.add(this.state.listName);

    this.state.user.setState({addingList: false});

    thisRanking.set({
        listDisplayName: this.state.listDisplayName,
        items: this.state.items,
        type: this.state.type,
      })
    thisUser.update({
      userLists: Array.from(thisUserLists),
    });
    
    if (this.state.editMode) {
      this.setState({editMode: false});
    }
  }

  /** Switches between viewing and editing mode. */
  turnOnEditing() {
    this.setState({editMode: true})
  }

  handleListDelete() {
    if (window.confirm('Are you sure you want to delete this list?')) {
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
            <SortableComponent items={this.state.items} list={this} />
            <button id='editSave' className='btn btn-secondary' onClick={this.handleSave}>Save List</button>
            <button id='add' className='btn btn-info' onClick={this.handleAdd}>Add Item</button>
            <button id='delete' className='btn btn-danger' onClick={this.handleListDelete}>Delete List</button>
          </>
          :
          <> 
            <h4>{this.state.listDisplayName}</h4>
            <ol>{itemsList}</ol>
            <button id='editSave' className='btn btn-secondary' onClick={this.turnOnEditing}>Edit List</button>
            {newListMode ? null : <button id='add' className='btn btn-info' 
            onClick={this.handleAdd}>Add Item</button>}
          </>
          }
        </div>
        }
        
      </>
    )
  }
}