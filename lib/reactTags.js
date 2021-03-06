// Constants
var Keys = {
    ENTER: 13,
    TAB: 9,
    BACKSPACE: 8,
    UP_ARROW: 38,
    DOWN_ARROW: 40,
    ESCAPE: 27
};

var ItemTypes = { TAG: 'tag' };

// Components
var Tag = React.createClass({
    mixins: [ReactDND.DragDropMixin],
    propTypes: {
        onDelete: React.PropTypes.func.isRequired,
        tag: React.PropTypes.object.isRequired,
        moveCard: React.PropTypes.func.isRequired
    },
    statics: {
        configureDragDrop: function(register) {
            register(ItemTypes.TAG, {
                dragSource: {
                    beginDrag: function(component) {
                        return {
                            item: {
                                id: component.props.tag.id
                            }
                        }
                    }
                },
                dropTarget: {
                    over(component, item) {
                        component.props.moveTag(item.id, component.props.tag.id);
                    }
                }
            });
        }
    },
    render: function() {
        var isDragging = this.getDragState(ItemTypes.TAG).isDragging;
        return (
            <span className="tag"
                  {...this.dragSourceFor(ItemTypes.TAG)}
                  {...this.dropTargetFor(ItemTypes.TAG)}>{this.props.tag.text}
                <a className="remove" onClick={this.props.onDelete}>x</a>
            </span>
        )
    }
});

var Tags = React.createClass({
    componentDidMount: function() {
        this.refs.input.getDOMNode().focus();
    },
    getInitialState: function() {
        return {
            tags: this.props.tags,
            suggestions: this.props.suggestions,
            query: "",
            selectedIndex: -1,
            selectionMode: false
        }
    },
    handleDelete: function(i, e) {
        var tags = this.state.tags;
        tags.splice(i, 1);
        this.setState({
            tags: tags,
            query: ""
        });
    },
    markIt: function(input, query) {
        var escapedRegex = query.trim().replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
        var r = RegExp(escapedRegex, "gi");
        return {
          __html: input.replace(r, "<mark>$&</mark>")
        }
    },
    handleChange: function(e) {
        var query = e.target.value.trim();
        var suggestions = this.props.suggestions.filter(function(item) {
            return (item.toLowerCase()).search(query.toLowerCase()) === 0;
        });

        this.setState({
            query: query,
            suggestions: suggestions,
        });
    },
    handleKeyDown: function(e) {
        var tags = this.state.tags;
        var input = this.refs.input.getDOMNode();
        var query = this.state.query;
        var selectedIndex = this.state.selectedIndex;
        var suggestions = this.state.suggestions;

        // hide suggestions menu on escape
        if (e.keyCode === Keys.ESCAPE) {
            e.preventDefault();
            this.setState({
                selectedIndex: -1,
                selectionMode: false,
                suggestions: []
            });
        }

        // when enter or tab is pressed add query to tags
        if ((e.keyCode === Keys.ENTER || e.keyCode === Keys.TAB) && query != "") {
            e.preventDefault();
            if (this.state.selectionMode) {
                query = this.state.suggestions[this.state.selectedIndex];               
            }
            this.addTag(query);
        }

        // when backspace key is pressed and query is blank, delete tag
        if (e.keyCode === Keys.BACKSPACE && query == "") { //
            this.handleDelete(tags.length - 1);
        }

        // up arrow
        if (e.keyCode === Keys.UP_ARROW) {
            e.preventDefault();
            var selectedIndex = this.state.selectedIndex;
            // last item, cycle to the top
            if (selectedIndex <= 0) {
                this.setState({
                  selectedIndex: this.state.suggestions.length - 1,
                  selectionMode: true
                });
            } else {
                this.setState({
                  selectedIndex: selectedIndex - 1,
                  selectionMode: true
                });
            }
        }

        // down arrow
        if (e.keyCode === Keys.DOWN_ARROW) {
            e.preventDefault();
            this.setState({
                selectedIndex: (this.state.selectedIndex + 1) % suggestions.length,
                selectionMode: true
            });
        }
    },
    addTag: function(tag) {
        var tags = this.state.tags;
        var input = this.refs.input.getDOMNode();

        // add the tag in the list
        tags.push({
          id: tags.length + 1,
          text: tag
        });

        // reset the state
        this.setState({
            tags: tags,
            query: "",
            selectionMode: false,
            selectedIndex: -1
        });
        
        // focus back on the input box
        input.value = "";
        input.focus();
    },
    handleSuggestionClick: function(i, e) {
        this.addTag(this.state.suggestions[i]);
    },
    handleSuggestionHover: function(i, e) {
        this.setState({
            selectedIndex: i,
            selectionMode: true
        });
    },
    moveTag: function(id, afterId) {
        var tags = this.state.tags;

        // locate tags
        var tag = tags.filter(function(t) { return t.id === id })[0];
        var afterTag = tags.filter(function(t) { return t.id === afterId })[0];
        
        // find their position in the array
        var tagIndex = tags.indexOf(tag);
        var afterTagIndex = tags.indexOf(afterTag);

        // mutate array
        tags.splice(tagIndex, 1);
        tags.splice(afterTagIndex, 0, tag);

        // re-render
        this.setState({ tags: tags });
    },
    render: function() {
        var tagItems = this.state.tags.map(function(tag, i) {
            return <Tag tag={tag} 
                        onDelete={this.handleDelete.bind(this, i)}
                        moveTag={this.moveTag}/>
        }.bind(this));

        // get the suggestions for the given query
        var query = this.state.query.trim(),
            selectedIndex = this.state.selectedIndex,
            suggestions = [];

        // min-length of search query that is required - 2
        if (query.length > 1) {
            suggestions = this.state.suggestions.map(function(item, i) {
                return (
                    <li key={i} onClick={this.handleSuggestionClick.bind(this, i)}
                        onMouseOver={this.handleSuggestionHover.bind(this, i)}
                        className={i == selectedIndex ? "active" : ""}>
                        <span dangerouslySetInnerHTML={this.markIt(item, query)} />
                     </li>
                )
            }.bind(this));
        }

        return ( 
            <div className="tags"> 
              <div className="selected-tags">{tagItems}</div>
                <div className="tagInput">
                    <input ref="input" 
                        type="text" 
                        placeholder="Add new country"
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}/>
                    <div className="suggestions">
                      { suggestions.length > 0 ? <ul> {suggestions} </ul>  : "" }
                    </div>
                </div>
                  <pre> <code> {JSON.stringify(this.state.tags, null, 2)} </code> </pre>
            </div>
        )
    }
});

module.exports = Tags;

/*
React.render(
    React.createElement(Tags, {tags: tags, suggestions: suggestions}), 
    document.getElementById("app")
);
*/
