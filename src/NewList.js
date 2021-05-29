import React from 'react';
import './index.css';
import { RankingList, getExistingList, existingListNames } from './App.js';

/** Waystation to decide to create a new list or reorder a pre-created one */
export default class NewList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      createMode: false,
      orderMode: false,
      chooseMode: true,
      listName: ''
    }

    this.createList = this.createList.bind(this);
    this.orderList = this.orderList.bind(this);
    this.selectListName = this.selectListName.bind(this);

    const thisList = this.props.list;
    thisList.setState({listDisplayName: 'New List Creation'})
  }

  /** Function that runs when the User decides to create a new list,
   * results in the component become a CreateList Element
   */
  createList(event) {
    event.preventDefault();
    this.setState({createMode: true, chooseMode: false});
  }

  /** Function that runs when the User decides to reorder and existing list,
   * results in the component become a ReorderExistingList Element
   */
  orderList(event) {
    event.preventDefault();
    this.setState({orderMode: true, chooseMode: false});
  }

  /** Updates state to take into account existing list name selection */
  selectListName(event) {
    this.setState({listName: event.target.value});
  }

  componentDidMount() {
    if (document.getElementById('exListButton')) {
      document.getElementById('exListButton').disabled = true;
    }
  }

  componentDidUpdate() {
    if (document.getElementById('exListButton')) {
      if (this.state.listName === '--Select List Name--' || !(this.state.listName)) {
        document.getElementById('exListButton').disabled = true;
      } else {
        document.getElementById('exListButton').disabled = false;
      }
    }
  }

  render() {
    const userLists = this.props.user.state.lists;

    let chooseMode = this.state.chooseMode;
    let createMode = this.state.createMode;
    let orderMode = this.state.orderMode;

    let listOptions = [];

    for (var i of existingListNames){
      if (userLists.has(i)) {
        continue;
      }
      listOptions.push(<option key={i}>{i}</option>)
    }

    return (
      <div className='ranking-list'>
        {chooseMode ? 
          <form id='new-list'>
          {listOptions.length ? 
            <>
              <label><select className='form-control' onChange={this.selectListName}>
                <option key ="select">--Select List Name--</option>
                {listOptions}
              </select></label>
              <button className='btn btn-primary' id='exListButton' onClick={this.orderList}>
                Use Existing List
              </button>
              <hr />
            </>
          : null}
          
            <button className='btn btn-secondary' onClick={this.createList}>Create New List</button>
          </form> :
          (createMode ? <CreateList list={this.props.list} user={this.props.user} /> 
          : (orderMode ? <ReorderExistingList listName={this.state.listName} 
            list={this.props.list} user={this.props.user} /> 
          : null))
        }
      </div>
    )
  }
}

/** Waystation, allows the user to choose if they want to create a new list
 * or edit a pre-existing one.
 */
 export class CreateList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
      userInfo: props.user.props.user,
      entries: 3,
      listDisplayName: props.list.listDisplayName,
      listName: props.list.listName,
      type: props.list.type,
      items: [null, null, null],
      names: ['beatles', 'starwars', 'bajaFresh'],
      types: ['food', 'music', 'film']
    };

    const thisList = this.props.list;
    thisList.setState({listDisplayName: ''})

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
      listName: this.state.listName,
      listDisplayName: this.state.listDisplayName,
      type: this.state.type,
    });

    const thisUser = this.props.user;
    let userLists = thisUser.state.lists;
    userLists.add(this.state.listName);
    thisUser.setState({lists: userLists, addingList: false});
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
      typeOptions.push(<option key={this.state.types[i]}>{this.state.types[i]}</option>)
    }

    for (let i = 0; i < this.state.names.length; i++){
      rankingOptions.push(<option key={this.state.names[i]}>{this.state.names[i]}</option>)
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
          <option key ="select">--Select List Name--</option>
          {rankingOptions}
        </select></label><br />

        <label>List Category:&nbsp;</label>
        <label><select className='form-control' onChange={this.selectType}>
          <option key ="selectCat">--Select List Category--</option>
          {typeOptions}
        </select></label><br />

        <button className='btn btn-warning' onClick={this.handleSubmit}>Create List</button>
      </form>
    )
  }
}

class ReorderExistingList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listDisplayName: '',
      listName: props.listName,
      items: [],
      type: '',
      user: props.user,
      userEmail: props.user.state.email,
      loaded: false
    }

    console.log(props.listName)
    this.getListItems(props.listName);
  }

  getListItems(listName) {
    const thisRanking = this;
    getExistingList(listName)
    .then(function(result) {
      thisRanking.setState({type: result.type, items: result.items, loaded: true})
    })
  }

  render() {

    let loaded = this.state.loaded;

    return(
      <>
        {loaded ? 
          <RankingList
            items={this.state.items}
            listDisplayName = 'CUSTOM NAME'
            listName = {this.state.listName}
            type = {this.state.type}
            user={this.state.user}
            editMode={true}
          />
        : null
        }
      </>
      
    );
  }

}