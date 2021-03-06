import React from 'react';
// import ReactDOM from 'react-dom';
import '../index.css';
import {SortableContainer, SortableElement, sortableHandle} from 'react-sortable-hoc';
import arrayMove from 'array-move';

//============Drag and Drop Functionality============

const DragHandle = sortableHandle(() => <img src='https://i0.wp.com/css-tricks.com/wp-content/uploads/2012/10/threelines.png' alt=':::' className='sortable'/>);

const SortableItem = SortableElement(({value, removeItem, owner}) => 
  <li className="sortable" key={value[0]}>
    <DragHandle />
    &nbsp;{value[0]}
    {owner ? <button className='btn btn-danger remove' onClick={() => removeItem(value[1])}>Remove Item</button> : null}
  </li>);

const SortableList = SortableContainer(({items, removeItem, owner}) => {
  return (
    <ol>
      {items.map((value, index) => (
          <SortableItem key={`item-${value}`} id={index} owner={owner} index={index} value={[value, index]} removeItem={removeItem}/>
      ))}
    </ol>
  );
});

export default class SortableComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: props.items,
      owner: props.owner
    };

    this.removeItem = this.removeItem.bind(this);
  }

  removeItem(index) {
    const items = this.state.items;
    items.splice(index, 1);

    this.setState({items : items})
}

  onSortEnd = ({oldIndex, newIndex}) => {
    this.setState(({items}) => (
      {
      items: arrayMove(items, oldIndex, newIndex),
    }));
    this.props.list.setState({
      items: this.state.items});
  };

  render() {
    return (
    <>
      <SortableList onSortEnd={this.onSortEnd} items={this.state.items} list={this.props.list} 
        removeItem={this.removeItem} owner={this.state.owner} useDragHandle/>
    </>
    );
  }
}