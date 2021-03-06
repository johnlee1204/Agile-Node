/**
 * See https://developers.google.com/api-client-library/javascript/
 * See https://developers.google.com/apis-explorer/#p/
 *
 *  googleApis: { 'calendar': { version: 'v3' } }
 */
Ext.define('Ext.google.ux.Client', {
    extend: 'Ext.Mixin',
    mixins: [
        'Ext.mixin.Mashup'
    ],
    requiredScripts: [
        '//apis.google.com/js/client.js?onload=_ext_google_ux_client_initialize_'
    ],
    statics: {
        getApiVersion: function(api) {
            var library = this.libraries[api];
            return library && library.state == 2 ? library.version : null;
        }
    },
    mixinConfig: {
        extended: function(baseClass, derivedClass, classBody) {
            this.load(classBody.googleApis);
        }
    },
    onClassMixedIn: function(cls) {
        this.load(cls.prototype.googleApis);
    },
    privates: {
        statics: {
            /**
             * @property {Boolean} initialized
             * `true` if the google client has been loaded and initialized.
             * @private
             */
            initialized: false,
            /**
             * @property {Boolean} blocked
             * `true` if this class has blocked Ext.env.Ready, else false.
             * @private
             */
            blocked: false,
            /**
             * @property {Number} loading
             * Keep track of how many libraries are loading.
             * @private
             */
            loading: 0,
            /**
             * @property {Object} libraries
             * Information about required libraries.
             * { `api_name`: { version: string, state: int }
             * state: 0 (pending), 1 (loading), 2 (loaded)
             * Example: { calendar: { version: 'v1', state: 1 } }
             * @private
             */
            libraries: {},
            load: function(apis) {
                var libraries = this.libraries,
                    version, library;
                if (!Ext.isObject(apis)) {
                    return;
                }
                Ext.Object.each(apis, function(api, cfg) {
                    version = cfg.version || 'v1';
                    library = libraries[api];
                    if (!Ext.isDefined(library)) {
                        libraries[api] = {
                            version: version,
                            state: 0
                        };
                    } else if (library.version !== version) {
                        Ext.log.error('Google API: failed to load version "' + version + '" of the', '"' + api + '" API: "' + library.version + '" already loaded.');
                    }
                });
                this.refresh();
            },
            refresh: function() {
                var me = this;
                if (!me.initialized) {
                    return;
                }
                if (!me.blocked) {
                    Ext.env.Ready.block();
                    me.blocked = true;
                }
                Ext.Object.each(me.libraries, function(api, library) {
                    if (library.state == 0) {
                        library.state = 1;
                        // loading
                        gapi.client.load(api, library.version, function() {
                            library.state = 2;
                            // loaded
                            if (!--me.loading) {
                                me.refresh();
                            }
                        });
                    }
                    if (library.state == 1) {
                        me.loading++;
                    }
                });
                if (!me.loading && me.blocked) {
                    Ext.env.Ready.unblock();
                    me.blocked = false;
                }
            },
            initialize: function() {
                this.initialized = true;
                this.refresh();
            }
        }
    }
});
// See https://developers.google.com/api-client-library/javascript/features/authentication
_ext_google_ux_client_initialize_ = function() {
    gapi.auth.init(function() {
        Ext.google.ux.Client.initialize();
    });
};

/**
 * Base proxy for accessing **[Google API](https://developers.google.com/apis-explorer/#p/)** resources.
 */
Ext.define('Ext.google.data.AbstractProxy', {
    extend: 'Ext.data.proxy.Server',
    mixins: [
        'Ext.google.ux.Client'
    ],
    // TODO: Batch actions
    // https://developers.google.com/api-client-library/javascript/features/batch
    /**
     * @cfg batchActions
     * @inheritdoc
     */
    batchActions: false,
    /**
     * @cfg reader
     * @inheritdoc
     */
    reader: {
        type: 'json',
        rootProperty: 'items',
        messageProperty: 'error'
    },
    /**
     * @method buildApiRequests
     * Returns a list of API request(s), **not executed**.
     * @param {Ext.data.Request} request The data request
     * @return {Object[]} API request(s)
     * @abstract
     */
    /**
     * @protected
     * @inheritdoc
     */
    doRequest: function(operation) {
        var me = this,
            request = me.buildRequest(operation),
            writer = me.getWriter(),
            error = false;
        if (writer && operation.allowWrite()) {
            request = writer.write(request);
        }
        me.execute(me.buildApiRequests(request)).then(function(response) {
            me.processApiResponse(operation, request, response);
        });
        return request;
    },
    /**
     * @method buildUrl
     * @protected
     * @inheritdoc
     */
    buildUrl: function(request) {
        return '';
    },
    privates: {
        execute: function(requests) {
            requests = [].concat(requests);
            // BUG: when using the gapi batch feature and trying to modify the same event
            // more than one time, the request partially fails and returns a 502 error.
            // See https://code.google.com/a/google.com/p/apps-api-issues/issues/detail?id=4528
            // TODO: use the following code once fixed! also check that it doesn't break
            // maxResults limit for event list requests.
            // var batch = gapi.client.newBatch();
            // Ext.Array.each(requests, function(r, i) { batch.add(r, { id: i }); });
            // return batch.execute();
            // WORKAROUND for the issue above (REMOVE ME)
            var results = [];
            return Ext.Array.reduce(requests, function(sequence, r) {
                return sequence.then(function() {
                    return r.then(function(result) {
                        results.push(result);
                    });
                });
            }, Ext.Deferred.resolved()).then(function() {
                return {
                    result: results
                };
            });
        },
        processApiResponse: function(operation, request, responses) {
            var error = false,
                results = [];
            // responses.result is not a regular Object, can't iterate with Ext.Object.each()
            Ext.each(Object.keys(responses.result), function(index) {
                var result = responses.result[index].result;
                if (result.error) {
                    error = result.error.message;
                    return false;
                }
                results.push(result);
            });
            this.processResponse(true, operation, request, {
                results: error ? [] : results,
                success: !error,
                error: error
            });
        },
        sanitizeItems: function(items) {
            var results = [],
                ids = [];
            // Batch can return different versions of the same record, only keep the last one.
            Ext.Array.each(items, function(item) {
                if (!Ext.Array.contains(ids, item.id)) {
                    results.push(item);
                    ids.push(item.id);
                }
            }, this, true);
            return results;
        }
    }
});

/**
 * Proxy to access Google **[event resources](https://developers.google.com/google-apps/calendar/v3/reference/events)**.
 */
Ext.define('Ext.google.data.EventsProxy', {
    extend: 'Ext.google.data.AbstractProxy',
    alias: 'proxy.google-events',
    googleApis: {
        'calendar': {
            version: 'v3'
        }
    },
    /**
     * @method buildApiRequests
     * @protected
     * @inheritdoc
     */
    buildApiRequests: function(request) {
        var me = this,
            action = request.getAction();
        switch (action) {
            case 'read':
                return me.buildReadApiRequests(request);
            case 'create':
                return me.buildCreateApiRequests(request);
            case 'update':
                return me.buildUpdateApiRequests(request);
            case 'destroy':
                return me.buildDestroyApiRequests(request);
            default:
                Ext.raise('unsupported request: events.' + action);
                return null;
        }
    },
    /**
     * @method extractResponseData
     * @protected
     * @inheritdoc
     */
    extractResponseData: function(response) {
        var me = this,
            data = me.callParent(arguments),
            items = [];
        Ext.each(data.results, function(result) {
            switch (result.kind) {
                case 'calendar#events':
                    items = items.concat(result.items.map(me.fromApiEvent.bind(me)));
                    break;
                case 'calendar#event':
                    items.push(me.fromApiEvent(result));
                    break;
                default:
                    break;
            }
        });
        return {
            items: me.sanitizeItems(items),
            success: data.success,
            error: data.error
        };
    },
    privates: {
        // https://developers.google.com/google-apps/calendar/v3/reference/events
        toApiEvent: function(data, allDay) {
            var res = {};
            Ext.Object.each(data, function(key, value) {
                var dateTime = null,
                    date = null;
                switch (key) {
                    case 'calendarId':
                    case 'description':
                        res[key] = value;
                        break;
                    case 'id':
                        res.eventId = value;
                        break;
                    case 'title':
                        res.summary = value;
                        break;
                    case 'startDate':
                    case 'endDate':
                        if (allDay) {
                            date = new Date(value);
                            date.setHours(0, -date.getTimezoneOffset());
                            date = Ext.Date.format(date, 'Y-m-d');
                        } else {
                            dateTime = Ext.Date.format(new Date(value), 'c');
                        };
                        // Need to explicitly set unused date field to null
                        // http://stackoverflow.com/a/35658479
                        res[key.slice(0, -4)] = {
                            date: date,
                            dateTime: dateTime
                        };
                        break;
                    default:
                        break;
                }
            });
            return res;
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/events
        fromApiEvent: function(data) {
            var res = {
                    allDay: true
                };
            Ext.Object.each(data, function(key, value) {
                var date, offset, allDay;
                switch (key) {
                    case 'id':
                    case 'description':
                        res[key] = value;
                        break;
                    case 'summary':
                        res.title = value;
                        break;
                    case 'start':
                    case 'end':
                        date = Ext.Date.parse(value.dateTime || value.date, 'C');
                        offset = date.getTimezoneOffset();
                        allDay = !!value.date;
                        // IMPORTANT: all day events must have their time equal to 00:00 GMT
                        if (allDay && offset !== 0) {
                            date.setHours(0, -offset);
                        };
                        res[key + 'Date'] = date;
                        res.allDay = res.allDay && allDay;
                        break;
                    default:
                        break;
                }
            });
            return res;
        },
        // See https://developers.google.com/google-apps/calendar/v3/reference/events/list
        buildReadApiRequests: function(request) {
            // by default, the API returns max 250 events per request, up to 2500. Since we
            // don't have control on the min & max requested times, and don't know how many
            // events will be returned, let's split requests per 3 months and set maxResults
            // to 2500 (~26 events per day - should be enough!?).
            var rparams = request.getParams(),
                start = new Date(rparams.startDate),
                end = new Date(rparams.endDate),
                requests = [],
                next;
            while (start < end) {
                next = Ext.Date.add(start, Ext.Date.MONTH, 3);
                if (next > end) {
                    next = end;
                }
                requests.push(gapi.client.calendar.events.list({
                    calendarId: rparams.calendar,
                    timeMin: Ext.Date.format(start, 'C'),
                    timeMax: Ext.Date.format(next, 'C'),
                    singleEvents: true,
                    maxResults: 2500
                }));
                start = next;
            }
            return requests;
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/events/insert
        buildCreateApiRequests: function(request) {
            var record = request.getRecords()[0];
            // batch not currently supported!
            return gapi.client.calendar.events.insert(this.toApiEvent(request.getJsonData(), record.get('allDay')));
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/events/patch
        // https://developers.google.com/google-apps/calendar/v3/reference/events/move
        buildUpdateApiRequests: function(request) {
            var record = request.getRecords()[0],
                // batch not currently supported!
                params = this.toApiEvent(request.getJsonData(), record.get('allDay')),
                prevCalendarId = record.getModified('calendarId'),
                currCalendarId = record.get('calendarId'),
                eventId = record.getId(),
                requests = [];
            // REQUIRED fields for the patch API
            params.calendarId = currCalendarId;
            params.eventId = eventId;
            if (prevCalendarId && prevCalendarId !== currCalendarId) {
                // The event has been moved to another calendar
                requests.push(gapi.client.calendar.events.move({
                    destination: currCalendarId,
                    calendarId: prevCalendarId,
                    eventId: eventId
                }));
            }
            if (Object.keys(params).length > 2) {
                // There is fields to update other than the calendarId + eventId
                requests.push(gapi.client.calendar.events.patch(params));
            }
            return requests;
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/events/delete
        buildDestroyApiRequests: function(request) {
            var record = request.getRecords()[0];
            // batch not currently supported!
            data = request.getJsonData();
            // The current calendar implementation nullifies the calendar ID before deleting
            // it, so let's get it from the previous values if not anymore in data.
            data.calendarId = data.calendarId || record.get('calendarId') || record.getPrevious('calendarId');
            // ['delete'] to make YUI happy
            return gapi.client.calendar.events.delete({
                'calendarId': data.calendarId,
                'eventId': data.id
            });
        }
    }
});

/**
 * Proxy to access Google **[calendar resources](https://developers.google.com/google-apps/calendar/v3/reference/calendarList)**.
 */
Ext.define('Ext.google.data.CalendarsProxy', {
    extend: 'Ext.google.data.AbstractProxy',
    alias: 'proxy.google-calendars',
    requires: [
        'Ext.google.data.EventsProxy'
    ],
    googleApis: {
        'calendar': {
            version: 'v3'
        }
    },
    /**
     * @method buildApiRequests
     * @protected
     * @inheritdoc
     */
    buildApiRequests: function(request) {
        var me = this,
            action = request.getAction();
        switch (action) {
            case 'read':
                return me.buildReadApiRequests(request);
            case 'update':
                return me.buildUpdateApiRequests(request);
            default:
                Ext.raise('unsupported request: calendars.' + action);
                return null;
        }
    },
    /**
     * @method extractResponseData
     * @protected
     * @inheritdoc
     */
    extractResponseData: function(response) {
        var me = this,
            data = me.callParent(arguments),
            items = [];
        // We assume that the response contains only results of the same kind.
        Ext.each(data.results, function(result) {
            switch (result.kind) {
                case 'calendar#calendarList':
                    items = items.concat(result.items.map(me.fromApiCalendar.bind(me)));
                    break;
                default:
                    break;
            }
        });
        return {
            items: me.sanitizeItems(items),
            success: data.success,
            error: data.error
        };
    },
    privates: {
        // https://developers.google.com/google-apps/calendar/v3/reference/calendarList#resource
        toApiCalendar: function(data) {
            var res = {};
            Ext.Object.each(data, function(key, value) {
                switch (key) {
                    case 'id':
                        res.calendarId = value;
                        break;
                    case 'hidden':
                        res.selected = !value;
                        break;
                    default:
                        break;
                }
            });
            return res;
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/calendarList#resource
        fromApiCalendar: function(data) {
            var record = {
                    hidden: !data.selected,
                    editable: false,
                    eventStore: {
                        autoSync: true,
                        proxy: {
                            type: 'google-events',
                            resourceTypes: 'events'
                        }
                    }
                };
            Ext.Object.each(data, function(key, value) {
                switch (key) {
                    case 'id':
                    case 'description':
                        record[key] = value;
                        break;
                    case 'backgroundColor':
                        record.color = value;
                        break;
                    case 'summary':
                        record.title = value;
                        break;
                    case 'accessRole':
                        record.editable = (value == 'owner' || value == 'writer');
                        break;
                    default:
                        break;
                }
            });
            return record;
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/calendarList/list
        buildReadApiRequests: function(request) {
            return gapi.client.calendar.calendarList.list();
        },
        // https://developers.google.com/google-apps/calendar/v3/reference/calendarList/patch
        buildUpdateApiRequests: function(request) {
            var data = this.toApiCalendar(request.getJsonData());
            return gapi.client.calendar.calendarList.patch(data);
        }
    }
});

/**
 * This base class can be used by derived classes to dynamically require Google API's.
 */
Ext.define('Ext.ux.google.Api', {
    mixins: [
        'Ext.mixin.Mashup'
    ],
    requiredScripts: [
        '//www.google.com/jsapi'
    ],
    statics: {
        loadedModules: {}
    },
    /*
             *  feeds: [ callback1, callback2, .... ]  transitions to -> feeds : true  (when complete)
             */
    onClassExtended: function(cls, data, hooks) {
        var onBeforeClassCreated = hooks.onBeforeCreated,
            Api = this;
        // the Ext.ux.google.Api class
        hooks.onBeforeCreated = function(cls, data) {
            var me = this,
                apis = [],
                requiresGoogle = Ext.Array.from(data.requiresGoogle),
                loadedModules = Api.loadedModules,
                remaining = 0,
                callback = function() {
                    if (!--remaining) {
                        onBeforeClassCreated.call(me, cls, data, hooks);
                    }
                    Ext.env.Ready.unblock();
                },
                api, i, length;
            /*
             *  requiresGoogle: [
             *      'feeds',
             *      { api: 'feeds', version: '1.x',
             *        callback : fn, nocss : true }  //optionals
             *  ]
             */
            length = requiresGoogle.length;
            for (i = 0; i < length; ++i) {
                if (Ext.isString(api = requiresGoogle[i])) {
                    apis.push({
                        api: api
                    });
                } else if (Ext.isObject(api)) {
                    apis.push(Ext.apply({}, api));
                }
            }
            Ext.each(apis, function(api) {
                var name = api.api,
                    version = String(api.version || '1.x'),
                    module = loadedModules[name];
                if (!module) {
                    ++remaining;
                    Ext.env.Ready.block();
                    loadedModules[name] = module = [
                        callback
                    ].concat(api.callback || []);
                    delete api.api;
                    delete api.version;
                    if (!window.google) {
                        Ext.raise("'google' is not defined.");
                        return false;
                    }
                    google.load(name, version, Ext.applyIf({
                        callback: function() {
                            loadedModules[name] = true;
                            for (var n = module.length; n-- > 0; ) {
                                module[n]();
                            }
                        }
                    }, // iterate callbacks in reverse
                    api));
                } else if (module !== true) {
                    module.push(callback);
                }
            });
            if (!remaining) {
                onBeforeClassCreated.call(me, cls, data, hooks);
            }
        };
    }
});

/**
 * Wraps a Google Map in an Ext.Component using the [Google Maps API](http://code.google.com/apis/maps/documentation/v3/introduction.html).
 *
 * This component will automatically include the google maps API script from:
 * `//maps.google.com/maps/api/js`
 *
 * ## Example
 *
 *     Ext.Viewport.add({
 *         xtype: 'map',
 *         useCurrentLocation: true
 *     });
 */
Ext.define('Ext.ux.google.Map', {
    extend: 'Ext.Container',
    xtype: [
        'map',
        'google-map'
    ],
    alternateClassName: 'Ext.Map',
    requires: [
        'Ext.util.Geolocation'
    ],
    mixins: [
        'Ext.mixin.Mashup'
    ],
    requires: [
        'Ext.data.StoreManager'
    ],
    requiredScripts: [
        '//maps.googleapis.com/maps/api/js{options}'
    ],
    isMap: true,
    /**
     * @event maprender
     * Fired when Map initially rendered.
     * @param {Ext.ux.google.Map} this
     * @param {google.maps.Map} map The rendered google.map.Map instance
     */
    /**
     * @event centerchange
     * Fired when map is panned around.
     * @param {Ext.ux.google.Map} this
     * @param {google.maps.Map} map The rendered google.map.Map instance
     * @param {google.maps.LatLng} center The current LatLng center of the map
     */
    /**
     * @event typechange
     * Fired when display type of the map changes.
     * @param {Ext.ux.google.Map} this
     * @param {google.maps.Map} map The rendered google.map.Map instance
     * @param {Number} mapType The current display type of the map
     */
    /**
     * @event zoomchange
     * Fired when map is zoomed.
     * @param {Ext.ux.google.Map} this
     * @param {google.maps.Map} map The rendered google.map.Map instance
     * @param {Number} zoomLevel The current zoom level of the map
     */
    /**
     * @event markerclick
     * Fired when the marker icon was clicked.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markerdblclick
     * Fired when the marker icon was double clicked.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markerdrag
     * Repeatedly fired while the user drags the marker.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markerdragend
     * Fired when the user stops dragging the marker.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markerdragstart
     * Fired when the user starts dragging the marker.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markermousedown
     * Fired for a mousedown on the marker.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markermouseout
     * Fired when the mouse leaves the area of the marker icon.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markermouseover
     * Fired when the mouse enters the area of the marker icon.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markermouseup
     * Fired for a mouseup on the marker.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    /**
     * @event markerrightclick
     * Fired for a rightclick on the marker.
     * @param {Ext.ux.google.Map} map This map instance
     * @param {Object} info Information about this event
     * @param {Number} info.index The index of the marker record
     * @param {Ext.data.Model} info.record The record associated to the marker
     * @param {google.maps.Marker} info.marker The [Google Map marker](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
     * @param {google.maps.MouseEvent} info.event The [Google Map event](https://developers.google.com/maps/documentation/javascript/3.exp/reference#MouseEvent)
     */
    config: {
        /**
         * @cfg {Boolean/Ext.util.Geolocation} useCurrentLocation
         * Pass in true to center the map based on the geolocation coordinates or pass a
         * {@link Ext.util.Geolocation GeoLocation} config to have more control over your GeoLocation options
         * @accessor
         */
        useCurrentLocation: false,
        /**
         * @cfg {google.maps.Map} map
         * The wrapped map.
         * @accessor
         */
        map: null,
        /**
         * @cfg {Ext.util.Geolocation} geo
         * Geolocation provider for the map.
         * @accessor
         */
        geo: null,
        /**
         * @cfg {Object} mapOptions
         * MapOptions as specified by the Google Documentation:
         * [http://code.google.com/apis/maps/documentation/v3/reference.html](http://code.google.com/apis/maps/documentation/v3/reference.html)
         * @accessor
         */
        mapOptions: {},
        /**
         * @cfg {Object} mapListeners
         * Listeners for any Google Maps events specified by the Google Documentation:
         * [http://code.google.com/apis/maps/documentation/v3/reference.html](http://code.google.com/apis/maps/documentation/v3/reference.html)
         *
         * @accessor
         */
        mapListeners: null,
        /**
         * @cfg {Ext.data.Store/Object/Ext.data.Model[]/Ext.ux.google.map.Marker} markers
         * Can be either a Store instance, a configuration object that will be turned into a
         * store, an array of model or a single model (in which case a store will be created).
         * The Store is used to populate the set of markers that will be rendered in the map.
         * Marker options are read through the {@link #markerTemplate} config.
         */
        markers: null,
        /**
         * @cfg {Object/Ext.util.ObjectTemplate} markerTemplate
         * This is a template used to produce marker options from the {@link #markers} records.
         * See {@link Ext.ux.google.map.Marker} for details.
         */
        markerTemplate: {
            title: '{title}',
            position: '{position}',
            animation: '{animation}',
            // google.maps.Animation.DROP
            clickable: '{clickable}',
            draggable: '{draggable}',
            visible: '{visible}'
        }
    },
    baseCls: Ext.baseCSSPrefix + 'map',
    constructor: function(config) {
        this.callParent([
            config
        ]);
        if (!(window.google || {}).maps) {
            this.setHtml('Google Maps API is required');
        }
    },
    initialize: function() {
        this.callParent();
        this.initMap();
        this.on({
            painted: 'onPainted',
            scope: this
        });
        this.bodyElement.on('touchstart', 'onTouchStart', this);
    },
    initMap: function() {
        var map = this.getMap();
        if (!map) {
            var gm = (window.google || {}).maps;
            if (!gm) {
                return null;
            }
            var element = this.mapContainer,
                mapOptions = this.getMapOptions(),
                event = gm.event,
                me = this;
            // Remove the API Required div
            if (element.dom.firstChild) {
                Ext.fly(element.dom.firstChild).destroy();
            }
            if (Ext.os.is.iPad) {
                Ext.merge({
                    navigationControlOptions: {
                        style: gm.NavigationControlStyle.ZOOM_PAN
                    }
                }, mapOptions);
            }
            mapOptions.mapTypeId = mapOptions.mapTypeId || gm.MapTypeId.ROADMAP;
            mapOptions.center = mapOptions.center || new gm.LatLng(37.381592, -122.135672);
            // Palo Alto
            if (mapOptions.center && mapOptions.center.latitude && !Ext.isFunction(mapOptions.center.lat)) {
                mapOptions.center = new gm.LatLng(mapOptions.center.latitude, mapOptions.center.longitude);
            }
            mapOptions.zoom = mapOptions.zoom || 12;
            map = new gm.Map(element.dom, mapOptions);
            this.setMap(map);
            event.addListener(map, 'zoom_changed', Ext.bind(me.onZoomChange, me));
            event.addListener(map, 'maptypeid_changed', Ext.bind(me.onTypeChange, me));
            event.addListener(map, 'center_changed', Ext.bind(me.onCenterChange, me));
            event.addListenerOnce(map, 'tilesloaded', Ext.bind(me.onTilesLoaded, me));
            this.addMapListeners();
        }
        return this.getMap();
    },
    // added for backwards compatibility for touch < 2.3
    renderMap: function() {
        this.initMap();
    },
    getElementConfig: function() {
        return {
            reference: 'element',
            className: 'x-container',
            children: [
                {
                    reference: 'bodyElement',
                    className: 'x-inner',
                    children: [
                        {
                            reference: 'mapContainer',
                            className: Ext.baseCSSPrefix + 'map-container'
                        }
                    ]
                }
            ]
        };
    },
    onTouchStart: function(e) {
        e.makeUnpreventable();
    },
    updateMap: function(map) {
        var markers = this.getMarkers();
        if (markers) {
            markers.each(function(record) {
                var marker = this.getMarkerForRecord(record);
                if (marker) {
                    marker.setMap(map);
                }
            }, this);
        }
    },
    applyMapOptions: function(options) {
        return Ext.merge({}, this.options, options);
    },
    updateMapOptions: function(newOptions) {
        var gm = (window.google || {}).maps,
            map = this.getMap();
        if (gm && map) {
            map.setOptions(newOptions);
        }
    },
    applyMarkers: function(value) {
        if (!value) {
            return null;
        }
        if (value.isStore) {
            return value;
        }
        if (Ext.isArray(value)) {
            value = {
                data: value
            };
        } else if (Ext.isObject(value)) {
            value = {
                data: [
                    value
                ]
            };
        }
        return Ext.getStore(value);
    },
    updateMarkers: function(curr, prev) {
        var me = this,
            listeners = {
                add: 'onMarkersAdd',
                remove: 'onMarkersRemove',
                itemchange: 'onMarkerChange',
                scope: this
            };
        if (prev && prev.isStore) {
            prev.getData().un(listeners);
            me.removeMarkers(prev.getRange());
        }
        if (curr && curr.isStore) {
            me.addMarkers(curr.getRange());
            curr.getData().on(listeners);
        }
    },
    applyMarkerTemplate: function(value) {
        return Ext.util.ObjectTemplate.create(value);
    },
    updateMarkerTemplate: function(value) {
        var markers = this.getMarkers();
        if (markers) {
            this.refreshMarkers(markers.getRange());
        }
    },
    doMapCenter: function() {
        this.setMapCenter(this.getMapOptions().center);
    },
    getMapOptions: function() {
        return Ext.merge({}, this.options || this.getInitialConfig('mapOptions'));
    },
    updateUseCurrentLocation: function(useCurrentLocation) {
        this.setGeo(useCurrentLocation);
        if (!useCurrentLocation) {
            this.setMapCenter();
        }
    },
    applyGeo: function(config) {
        return Ext.factory(config, Ext.util.Geolocation, this.getGeo());
    },
    updateGeo: function(newGeo, oldGeo) {
        var events = {
                locationupdate: 'onGeoUpdate',
                locationerror: 'onGeoError',
                scope: this
            };
        if (oldGeo) {
            oldGeo.un(events);
        }
        if (newGeo) {
            newGeo.on(events);
            newGeo.updateLocation();
        }
    },
    /**
     * @private
     */
    onPainted: function() {
        var gm = (window.google || {}).maps,
            map = this.getMap(),
            center;
        if (gm && map) {
            center = map.getCenter();
            gm.event.trigger(map, 'resize');
            if (center) {
                map.setCenter(center);
            }
        }
    },
    /**
     * @private
     */
    onTilesLoaded: function() {
        this.fireEvent('maprender', this, this.getMap());
    },
    /**
     * @private
     */
    addMapListeners: function() {
        var gm = (window.google || {}).maps,
            map = this.getMap(),
            mapListeners = this.getMapListeners();
        if (gm) {
            var event = gm.event,
                me = this,
                listener, scope, fn, callbackFn, handle;
            if (Ext.isSimpleObject(mapListeners)) {
                for (var eventType in mapListeners) {
                    listener = mapListeners[eventType];
                    if (Ext.isSimpleObject(listener)) {
                        scope = listener.scope;
                        fn = listener.fn;
                    } else if (Ext.isFunction(listener)) {
                        scope = null;
                        fn = listener;
                    }
                    if (fn) {
                        callbackFn = function() {
                            this.fn.apply(this.scope, [
                                me
                            ]);
                            if (this.handle) {
                                event.removeListener(this.handle);
                                delete this.handle;
                                delete this.fn;
                                delete this.scope;
                            }
                        };
                        handle = event.addListener(map, eventType, Ext.bind(callbackFn, callbackFn));
                        callbackFn.fn = fn;
                        callbackFn.scope = scope;
                        if (listener.single === true) {
                            callbackFn.handle = handle;
                        }
                    }
                }
            }
        }
    },
    /**
     * @private
     */
    onGeoUpdate: function(geo) {
        if (geo) {
            this.setMapCenter(new google.maps.LatLng(geo.getLatitude(), geo.getLongitude()));
        }
    },
    /**
     * @method
     * @private
     */
    onGeoError: Ext.emptyFn,
    /**
     * Moves the map center to a google.maps.LatLng object representing to the target location,
     * a marker record from the {@link #cfg-markers markers} store, or to the designated
     * coordinates hash of the form:
     *
     *     { latitude: 37.381592, longitude: -122.135672 }
     *
     * @param {Object/Ext.data.Model/google.maps.LatLng} coordinates Object representing the
     * desired latitude and longitude upon which to center the map.
     */
    setMapCenter: function(coordinates) {
        var me = this,
            map = me.getMap(),
            mapOptions = me.getMapOptions(),
            gm = (window.google || {}).maps,
            marker;
        if (gm) {
            if (!coordinates) {
                if (map && map.getCenter) {
                    coordinates = map.getCenter();
                } else if (mapOptions.hasOwnProperty('center')) {
                    coordinates = mapOptions.center;
                } else {
                    coordinates = new gm.LatLng(37.381592, -122.135672);
                }
            }
            // Palo Alto
            else if (coordinates.isModel) {
                var marker = me.getMarkerForRecord(coordinates);
                coordinates = marker && marker.position;
            }
            if (coordinates && !(coordinates instanceof gm.LatLng) && 'longitude' in coordinates) {
                coordinates = new gm.LatLng(coordinates.latitude, coordinates.longitude);
            }
            if (!map) {
                mapOptions.center = mapOptions.center || coordinates;
                me.renderMap();
                map = me.getMap();
            }
            if (map && coordinates instanceof gm.LatLng) {
                map.panTo(coordinates);
            } else {
                this.options = Ext.apply(this.getMapOptions(), {
                    center: coordinates
                });
            }
        }
    },
    /**
     * Scales and pans the view to ensure that the given markers fits inside the map view.
     * @param {Ext.data.Model[]} records The markers records to fit in view.
     */
    fitMarkersInView: function(records) {
        var me = this,
            map = me.getMap(),
            b2 = map.getBounds(),
            markers = me.getMarkers(),
            gm = (window.google || {}).maps,
            b1, b1ne, b1sw, b2ne, b2sw;
        if (!map || !b2 || !markers) {
            return;
        }
        if (Ext.isEmpty(records)) {
            records = markers.getRange();
            if (Ext.isEmpty(records)) {
                return;
            }
        }
        b1 = new gm.LatLngBounds();
        Ext.each(records, function(record) {
            var marker = me.getMarkerForRecord(record);
            if (marker) {
                b1.extend(marker.getPosition());
            }
        });
        b1ne = b1.getNorthEast();
        b1sw = b1.getSouthWest();
        b2ne = b2.getNorthEast();
        b2sw = b2.getSouthWest();
        if ((b1ne.lat() - b1sw.lat()) > (b2ne.lat() - b2sw.lat()) || (b1ne.lng() - b1sw.lng()) > (b2ne.lng() - b2sw.lng())) {
            map.fitBounds(b1);
        } else {
            map.panToBounds(b1);
        }
    },
    /**
     * @private
     */
    onZoomChange: function() {
        var mapOptions = this.getMapOptions(),
            map = this.getMap(),
            zoom;
        zoom = (map && map.getZoom) ? map.getZoom() : mapOptions.zoom || 10;
        this.options = Ext.apply(mapOptions, {
            zoom: zoom
        });
        this.fireEvent('zoomchange', this, map, zoom);
    },
    /**
     * @private
     */
    onTypeChange: function() {
        var mapOptions = this.getMapOptions(),
            map = this.getMap(),
            mapTypeId;
        mapTypeId = (map && map.getMapTypeId) ? map.getMapTypeId() : mapOptions.mapTypeId;
        this.options = Ext.apply(mapOptions, {
            mapTypeId: mapTypeId
        });
        this.fireEvent('typechange', this, map, mapTypeId);
    },
    /**
     * @private
     */
    onCenterChange: function() {
        var mapOptions = this.getMapOptions(),
            map = this.getMap(),
            center;
        center = (map && map.getCenter) ? map.getCenter() : mapOptions.center;
        this.options = Ext.apply(mapOptions, {
            center: center
        });
        this.fireEvent('centerchange', this, map, center);
    },
    doDestroy: function() {
        Ext.destroy(this.getGeo());
        var map = this.getMap();
        if (map && (window.google || {}).maps) {
            google.maps.event.clearInstanceListeners(map);
        }
        this.callParent();
    },
    privates: {
        // See google.map.Marker API
        // https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker
        markerEvents: [
            'click',
            'dblclick',
            'drag',
            'dragend',
            'dragstart',
            'mousedown',
            'mouseout',
            'mouseover',
            'mouseup',
            'rightclick'
        ],
        getMarkerForRecord: function(record) {
            var expando = record && Ext.getExpando(record, this.getId());
            return (expando && expando.marker) || null;
        },
        buildMarkerOptions: function(record, tpl) {
            var options = tpl.apply(record.getData(true)),
                gm = (window.google || {}).maps,
                animation = options.animation;
            if (typeof animation === 'string') {
                options.animation = gm.Animation[animation] || null;
            }
            return options;
        },
        addMarkers: function(records) {
            var me = this,
                eid = me.getId(),
                map = me.getMap(),
                tpl = me.getMarkerTemplate(),
                gm = (window.google || {}).maps,
                store = me.getMarkers(),
                events = me.markerEvents;
            Ext.each(records, function(record) {
                var index = store.indexOf(record),
                    options = me.buildMarkerOptions(record, tpl),
                    marker = new gm.Marker(Ext.apply(options, {
                        map: map
                    })),
                    listeners = events.map(function(type) {
                        return marker.addListener(type, function(event) {
                            me.fireEvent('marker' + type, me, {
                                index: index,
                                record: record,
                                marker: marker,
                                event: event
                            });
                        });
                    });
                Ext.setExpando(record, eid, {
                    listeners: listeners,
                    marker: marker
                });
            });
        },
        removeMarkers: function(records) {
            var eid = this.getId();
            Ext.each(records, function(record) {
                var expando = Ext.getExpando(record, eid),
                    marker = expando && expando.marker;
                if (marker) {
                    marker.setMap(null);
                    Ext.each(expando.listeners || [], function(listener) {
                        listener.remove();
                    });
                }
                Ext.setExpando(record, eid, undefined);
            });
        },
        refreshMarkers: function(records) {
            var me = this,
                tpl = me.getMarkerTemplate(),
                count = records.length,
                record, marker, i;
            for (i = 0; i < count; ++i) {
                record = records[i];
                marker = me.getMarkerForRecord(record);
                if (marker) {
                    marker.setOptions(me.buildMarkerOptions(record, tpl));
                }
            }
        },
        onMarkersAdd: function(collection, details) {
            this.addMarkers(details.items);
        },
        onMarkersRemove: function(collection, details) {
            this.removeMarkers(details.items);
        },
        onMarkerChange: function(collection, details) {
            this.refreshMarkers([
                details.item
            ]);
        }
    }
});

/**
 * Provided for convenience, this model exposes the default Google Map Marker options.
 *
 * See https://developers.google.com/maps/documentation/javascript/3.exp/reference#MarkerOptions
 *
 * ## Fields
 *
 * - position {Object} - The marker position (required)
 * - position.lat {Number} - Latitude in degrees
 * - position.lng {Number} - Longitude in degrees
 * - title {String} - The rollover text (default: null)
 * - animation {String/Number} - The animation to play when the marker is added to the map.
 *    Can be either null (no animation), a string ("BOUNCE" or "DROP"") or a value from
 *   [google.maps.Animation](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Animation)
 * - clickable {Boolean} - Whether the marker receives mouse and touch events (default: true)
 * - draggable {Boolean} - Whether the marker can be dragged (default: false)
 * - draggable {Boolean} - Whether the marker is visible (default: true)
 *
 * ## Custom model
 *
 * It's not required to inherit from this model in order to display markers. By providing the
 * suitable  {@link Ext.ux.google.Map#cfg-markerTemplate markerTemplate}, marker options can
 * be extracted from any records, for example:
 *
 *      Ext.define('MyApp.model.Office', {
 *          extend: 'Ext.data.Model',
 *          fields: [
 *              'name',
 *              'address',
 *              'latitute',
 *              'longitude'
 *          ]
 *      });
 *
 * and the associated view config:
 *
 *      {
 *          xtype: 'map',
 *          store: 'offices',
 *          markerTemplate: {
 *              title: '{name}',
 *              position: {
 *                  lat: '{latitute}',
 *                  lng: '{longitude}'
 *              }
 *          }
 *    }
 *
 */
Ext.define('Ext.ux.google.map.Marker', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: 'position',
            type: 'auto'
        },
        {
            name: 'title',
            type: 'string',
            defaultValue: null
        },
        {
            name: 'animation',
            type: 'number',
            defaultValue: 'DROP',
            persist: false
        },
        {
            name: 'clickable',
            type: 'boolean',
            defaultValue: true,
            persist: false
        },
        {
            name: 'draggable',
            type: 'boolean',
            defaultValue: false,
            persist: false
        },
        {
            name: 'visible',
            type: 'boolean',
            defaultValue: true,
            persist: false
        }
    ]
});

