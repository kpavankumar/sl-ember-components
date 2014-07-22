import Ember from 'ember';
import TooltipEnabled from '../mixins/tooltip-enabled';

/**
 * @module components
 * @class sl-select
 */
export default Ember.Component.extend( TooltipEnabled, {

    /**
     * Attribute bindings for the select element
     * @property {array} attributeBindings
     */
    attributeBindings: [ 'disabled', 'type' ],

    /**
     * Class names for the select element
     * @property {array} classNames
     */
    classNames: [ 'form-control', 'sl-select' ],

    /**
     * Called when the bound content changes
     * @method contentChanged
     */
    contentChanged: Ember.observer( 'content.@each', function () {
        this.valueChanged();
    }),

    /**
     * Set up select2 initialization after the element is inserted in the DOM
     * @method didInsertElement
     */
    didInsertElement: function () {
        var get  = Ember.get,
            self = this;

        this.$().select2({
            maximumSelectionSize: this.get( 'maximumSelectionSize' ),
            multiple:             this.get( 'multiple' ),
            placeholder:          this.get( 'placeholder' ),

            formatResult: function ( item ) {
                if ( !item ) { return; }

                if ( !( item instanceof Object )) {
                    return item;
                }

                var output      = get( item, self.get( 'optionLabelPath' )),
                    description = get( item, self.get( 'optionDescriptionPath' ));

                if ( description ) {
                    output +=  ' <span class="text-muted">' + description + '</span>';
                }

                return output;
            },

            formatSelection: function ( item ) {
                if ( !item ) { return; }

                if ( item instanceof Object ) {
                    return get( item, self.get( 'optionLabelPath' ));
                }

                return item;
            },

            id: function ( item ) {
                if ( item instanceof Object ) {
                    return get( item, self.get( 'optionValuePath' ));
                }

                return item;
            },

            initSelection: function ( element, callback ) {
                var value           = element.val(),
                    content         = self.get( 'content' ),
                    multiple        = self.get( 'multiple' ),
                    optionValuePath = self.get( 'optionValuePath' );

                if ( !value || !value.length ) {
                    return callback( [] );
                }

                var values          = value.split( ',' ),
                    filteredContent = [],
                    contentLength   = content.length,
                    unmatchedValues = values.length,
                    item, matchIndex, text;

                for ( var i = 0; i < contentLength; i++ ) {
                    item = content[i];
                    text = item instanceof Object ? get( item, optionValuePath ) : item;
                    matchIndex = values.indexOf( text.toString() );

                    if ( matchIndex !== -1 ) {
                        filteredContent[ matchIndex ] = item;
                        if ( --unmatchedValues === 0 ) {
                            break;
                        }
                    }
                }

                if ( unmatchedValues === 0 ) {
                    self.$().select2( 'readonly', false );
                } else {
                    self.$().select2( 'readonly', true );

                    Ember.warn( 'sl-select:select2#initSelection was not able to map each "' + optionValuePath + '" to an object from "content". The remaining keys are: ' + values + '. The input will be disabled until a) the desired objects are added to the "content" array, or b) the "value" is changed.', !values.length );
                }

                return callback( multiple ? filteredContent : filteredContent.get( 'firstObject' ));
            },

            minimumResultsForSearch: this.get( 'disableSearch' ) ? -1 : 0,

            query: function ( query ) {
                var optionLabelPath = self.get( 'optionLabelPath' ),
                    select2 = this;

                query.callback({
                    results: self.get( 'content' ).reduce( function ( results, item ) {
                        var text = item instanceof Object ? get( item, optionLabelPath ) : item;

                        if ( select2.matcher( query.term, text.toString() )) {
                            results.push( item );
                        }

                        return results;
                    }, [] )
                });
            }
        });

        this.$().on( 'change', function () {
            self.selectionChanged( self.$().select2( 'val' ));
        });

        this.valueChanged();
    },

    /**
     * Whether to show the search filter input or not
     * @property {boolean} disableSearch
     * @default false
     */
    disableSearch: false,

    /**
     * Attribute value for the select
     * @property {boolean} disabled
     * @default false
     */
    disabled: false,

    /**
     * The maximum number of selections allowed when `multiple` is enabled
     * @property {number} maximumSelectionSize
     * @default null
     */
    maximumSelectionSize: null,

    /**
     * Whether to allow multiple selections
     * @property {boolean} multiple
     * @default false
     */
    multiple: false,

    /**
     * The path key for each option object's description
     * @property {string} optionDescriptionPath
     * @default "description"
     */
    optionDescriptionPath: 'description',

    /**
     * The path key for each option object's label
     * @property {string} optionLabelPath
     * @default "label"
     */
    optionLabelPath: 'label',

    /**
     * The path key for each option object's value
     * @property {string} optionValuePath
     * @default "value"
     */
    optionValuePath: 'value',

    /**
     * Called when the object selection changes
     * @method selectionChanged
     * @param {mixed} data - Data from the selected option
     */
    selectionChanged: function ( value ) {
        this.set( 'value', value );
    },

    /**
     * Name of the tag type for select element
     * @property {string} tagName
     * @default "input"
     */
    tagName: 'input',

    /**
     * Type attribute for the select element
     * @property {string} type
     * @default "hidden"
     */
    type: 'hidden',

    /**
     * Called when the component's value has changed
     * @method valueChanged
     */
    valueChanged: Ember.observer( 'value', function () {
        this.$().select2( this.get( 'optionValuePath' ) ? 'val' : 'data', this.get( 'value' ));
    }),

    /**
     * Teardown to prevent memory leaks
     * @method willDestroyElement
     */
    willDestroyElement: function () {
        this.$().off( 'change' ).select2( 'destroy' );
    }
});
