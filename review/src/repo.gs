var Repository = {
  getProperties: function() {
    return PropertiesService.getUserProperties();
  },

  getMeetingInfo: function(e) {
    if (!e.calendar) return null;
    var event = CalendarApp.getCalendarById(e.calendar.calendarId).getEventById(e.calendar.id);
    if (!event) return null;
    
    return {
      title: event.getTitle() || "Reuniao_Sem_Nome",
      dateKey: Utilities.formatDate(event.getStartTime(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      event: event
    };
  },

  getGuestsData: function(event) {
    var props = this.getProperties();
    var rawGuests = event.getGuestList(true);
    var guestsData = {};

    if (rawGuests.length > 0) {
      rawGuests.forEach(function(g) {
        var email = g.getEmail().toLowerCase();
        var isGroup = false;

        if (email.indexOf('resource.calendar.google.com') !== -1) return;

        // OTIMIZAÇÃO: Verifica no cache se já sabemos que NÃO é um grupo
        var groupCacheKey = "IS_GROUP_" + email;
        var cachedGroupStatus = props.getProperty(groupCacheKey);

        if (cachedGroupStatus !== "FALSE") {
          try {
            var response = AdminDirectory.Members.list(email);
            if (response && response.members) {
              isGroup = true;
              props.setProperty(groupCacheKey, "TRUE");
              response.members.forEach(function(member) {
                var uEmail = member.email.toLowerCase();
                if (!guestsData[uEmail]) guestsData[uEmail] = Repository.getCachedUserData(uEmail, "", props);
              });
            }
          } catch (err) {
            props.setProperty(groupCacheKey, "FALSE");
          }

          // Fallback para GroupsApp
          if (!isGroup && cachedGroupStatus !== "FALSE") {
            try {
              var group = GroupsApp.getGroupByEmail(email);
              if (group) {
                isGroup = true;
                props.setProperty(groupCacheKey, "TRUE");
                group.getUsers().forEach(function(u) {
                  var uEmail = u.getEmail().toLowerCase();
                  if (!guestsData[uEmail]) guestsData[uEmail] = Repository.getCachedUserData(uEmail, "", props);
                });
              } else {
                props.setProperty(groupCacheKey, "FALSE");
              }
            } catch (err) {
              props.setProperty(groupCacheKey, "FALSE");
            }
          }
        } else {
          isGroup = false; // Cache disse que não é grupo, poupamos chamadas à API!
        }

        if (!isGroup && !guestsData[email]) {
          guestsData[email] = Repository.getCachedUserData(email, g.getName(), props);
        }
      });
    }

    return {
      dataMap: guestsData,
      allEmails: Object.keys(guestsData)
    };
  },

  getCachedUserData: function(email, defaultName, props) {
    var cacheKey = "USER_INFO_V2_" + email; 
    var cached = props.getProperty(cacheKey);
    
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    
    var userData = { name: defaultName || email.split('@')[0], photoUrl: null };
    
    try {
      var user = AdminDirectory.Users.get(email, {viewType: "domain_public"});
      if (user) {
        if (user.name && user.name.fullName) userData.name = user.name.fullName;
        if (user.thumbnailPhotoUrl) userData.photoUrl = user.thumbnailPhotoUrl;
      }
    } catch (err) {}
    
    props.setProperty(cacheKey, JSON.stringify(userData));
    return userData;
  },

  getMeetingState: function(title, dateKey) {
    var props = this.getProperties();
    return {
      excludeList: JSON.parse(props.getProperty("EXCLUDE_" + title) || "[]"),
      savedOrderStr: props.getProperty("ORDER_" + title + "_" + dateKey),
      isFirstTime: !props.getProperty("INIT_" + title)
    };
  },

  getScore: function(title, email) {
    return parseInt(this.getProperties().getProperty("SCORE_" + title + "_" + email) || "0", 10);
  },

  setInit: function(title) {
    this.getProperties().setProperty("INIT_" + title, "true");
  },

  saveScoresAndOrder: function(title, dateKey, newScoresMap, finalOrder) {
    var props = this.getProperties();
    props.setProperties(newScoresMap);
    props.setProperty("ORDER_" + title + "_" + dateKey, JSON.stringify(finalOrder));
  },

  resetScoresForEmails: function(title, emails) {
    var props = this.getProperties();
    emails.forEach(function(email) {
      props.deleteProperty("SCORE_" + title + "_" + email);
    });
  },

  toggleGuestExclusion: function(title, dateKey, email) {
    var props = this.getProperties();
    var excludeList = JSON.parse(props.getProperty("EXCLUDE_" + title) || "[]");
    var idx = excludeList.indexOf(email);
    var isExcluded = false;

    if (idx !== -1) {
      excludeList.splice(idx, 1);
    } else {
      excludeList.push(email);
      isExcluded = true;
    }
    
    props.setProperty("EXCLUDE_" + title, JSON.stringify(excludeList));
    props.deleteProperty("ORDER_" + title + "_" + dateKey); 
    return isExcluded;
  },

  deleteOrder: function(title, dateKey) {
    this.getProperties().deleteProperty("ORDER_" + title + "_" + dateKey);
  },

  clearMeetingData: function(title) {
    var props = this.getProperties();
    var allProps = props.getProperties();
    for (var key in allProps) {
      if (key.indexOf("SCORE_" + title) === 0 || 
          key.indexOf("ORDER_" + title) === 0 || 
          key.indexOf("INIT_" + title) === 0 || 
          key.indexOf("EXCLUDE_" + title) === 0) {
        props.deleteProperty(key);
      }
    }
  },

  flushAll: function() {
    this.getProperties().deleteAllProperties();
  }
};
