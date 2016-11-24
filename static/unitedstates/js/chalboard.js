var challenges;
var states;
var states_used;


function loadchal(id) {
    var obj = $.grep(challenges['game'], function (e) {
        return e.id == id;
    })[0];

    updateChalWindow(obj);
}

function loadchalbyname(chalname) {
    var obj = $.grep(challenges['game'], function (e) {
      return e.name == chalname;
    })[0];

    updateChalWindow(obj);
}

function updateChalWindow(obj) {
    window.location.replace(window.location.href.split('#')[0] + '#' + obj.name);
    var chal = $('#chal-window');
    chal.find('.chal-name').text(obj.name);
    chal.find('.chal-desc').html(marked(obj.description, {'gfm':true, 'breaks':true}));
    chal.find('.chal-files').empty();
    for (var i = 0; i < obj.files.length; i++) {
        var filename = obj.files[i].split('/');
        filename = filename[filename.length - 1];
        $('#chal-window').find('.chal-files').append("<div class='col-md-3 file-button-wrapper'><a class='file-button' href='" + script_root + '/files/' + obj.files[i] + "'><label class='challenge-wrapper file-wrapper hide-text'>" + filename + "</label></a></div>")
    }

    var tags = chal.find('.chal-tags');
    tags.empty();
    var tag = "<span class='label label-primary chal-tag'>{0}</span>";
    for (var i = 0; i < obj.tags.length; i++){
        var data = tag.format(obj.tags[i]);
        tags.append($(data));
    }

    chal.find('.chal-value').text(obj.value);
    chal.find('.chal-category').text(obj.category);
    chal.find('#chal-id').val(obj.id);
    var solves = obj.solves == 1 ? " Solve" : " Solves";
    chal.find('.chal-solves').text(obj.solves + solves);
    $('#answer').val("");

    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
}

$("#answer-input").keyup(function(event){
    if(event.keyCode == 13){
        $("#submit-key").click();
    }
});


function submitkey(chal, key, nonce) {
    $('#submit-key').addClass("disabled-button");
    $('#submit-key').prop('disabled', true);
    $.post(script_root + "/chal/" + chal, {
        key: key,
        nonce: nonce
    }, function (data) {
        var result = $.parseJSON(JSON.stringify(data));

        var result_message = $('#result-message');
        var result_notification = $('#result-notification');
        var answer_input = $("#answer-input");
        result_notification.removeClass();
        result_message.text(result.message);

        if (result.status == -1){
          window.location="/login"
          return
        }
        else if (result.status == 0){ // Incorrect key
            result_notification.addClass('alert alert-danger alert-dismissable');
            result_notification.slideDown();

            answer_input.removeClass("correct");
            answer_input.addClass("wrong");
            setTimeout(function () {
                answer_input.removeClass("wrong");
            }, 3000);
        }
        else if (result.status == 1){ // Challenge Solved
            result_notification.addClass('alert alert-success alert-dismissable');
            result_notification.slideDown();

            $('.chal-solves').text((parseInt($('.chal-solves').text().split(" ")[0]) + 1 +  " Solves") );

            answer_input.val("");
            answer_input.removeClass("wrong");
            answer_input.addClass("correct");
        }
        else if (result.status == 2){ // Challenge already solved
            result_notification.addClass('alert alert-info alert-dismissable');
            result_notification.slideDown();

            answer_input.addClass("correct");
        }
        else if (result.status == 3){ // Keys per minute too high
            result_notification.addClass('alert alert-warning alert-dismissable');
            result_notification.slideDown();

            answer_input.addClass("too-fast");
            setTimeout(function() {
                answer_input.removeClass("too-fast");
            }, 3000);
        }
        marksolves();
        updatesolves();
        setTimeout(function(){
          $('.alert').slideUp();
          $('#submit-key').removeClass("disabled-button");
          $('#submit-key').prop('disabled', false);
        }, 3000);
    })
}

function marksolves(cb) {
    $.get(script_root + '/solves', function (data) {
        var solves = $.parseJSON(JSON.stringify(data));
        for (var i = solves['solves'].length - 1; i >= 0; i--) {
            var id = solves['solves'][i].chalid;
            $('button[value="' + id + '"]').removeClass('theme-background');
            $('button[value="' + id + '"]').addClass('solved-challenge');
        };
        if (cb) {
            cb();
        }
    });
}

function updatesolves(cb){
    $.get(script_root + '/chals/solves', function (data) {
        var solves = $.parseJSON(JSON.stringify(data));
        var chals = Object.keys(solves);

        for (var i = 0; i < chals.length; i++) {
            var obj = $.grep(challenges['game'], function (e) {
                return e.name == chals[i];
            })[0];
            obj.solves = solves[chals[i]];
        };
        if (cb) {
            cb();
        }
    });
}

function getsolves(id){
  $.get(script_root + '/chal/'+id+'/solves', function (data) {
    var teams = data['teams'];
    var box = $('#chal-solves-names');
    box.empty();
    for (var i = 0; i < teams.length; i++) {
      var id = teams[i].id;
      var name = teams[i].name;
      var date = moment(teams[i].date).local().format('LLL');
      box.append('<tr><td><a href="/team/{0}">{1}</td><td>{2}</td></tr>'.format(id, htmlentities(name), date));
    };
  });
}


function loadchals_to_states(){
    $.get(script_root + "/chals", function (data) {
        challenges = $.parseJSON(JSON.stringify(data));
        // console.log(challenges);

        states_used = [];

        states = {
            'DE':1, 'PA':2, 'NJ':3, 'GA':4,
            'CT':5, 'MA':6, 'MD':7, 'SC':8,
            'NH':9, 'VA':10, 'NY':11, 'NC':12,
            'RI':13, 'VT':14, 'KY':15, 'TN':16,
            'OH':17, 'LA':18, 'IN':19, 'MS':20,
            'IL':21, 'AL':22, 'ME':23, 'MO':24,
            'AR':25, 'MI':26, 'FL':27, 'TX':28,
            'IA':29, 'WI':30, 'CA':31, 'MN':32,
            'OR':33, 'KS':34, 'WV':35, 'NV':36,
            'NE':37, 'CO':38, 'ND':39, 'SD':40,
            'MT':41, 'WA':42, 'ID':43, 'WY':44,
            'UT':45, 'OK':46, 'NM':47, 'AZ':48,
            'AK':49, 'HI':50
        }

        var categories = [];
        var category_colors = [];
        var statelabels = {};
        var chal_areas = {};
        var state_keys = Object.keys(states);
        var chals_used = [];

        for (var i = 0; i <= challenges['game'].length - 1; i++){
            var chal = challenges['game'][i];

            if ($.inArray(challenges['game'][i].category, categories) == -1) {
                var category = challenges['game'][i].category;
                categories.push(category);
            }

            chal.tags.forEach(function(tag) {
                if ($.inArray(tag, states_used) == -1){ // State asked for is available
                    chal_areas[tag] = {
                        value: chal.category,
                        tooltip: {content: "<span style=\"font-weight:bold;\">{0} {1}: {2}</span>".format(chal.category, parseInt(chal.value), chal.name)}
                    };
                    states_used.push(tag);
                    states[ state_keys[chal.id - 1] ] = 0;
                    states[tag] = chal.id
                    chals_used.push(chal.id);
                } else { // State asked for is unavailable.
                    var curr_chal = states[tag];
                    var curr_chal = $.grep(challenges['game'], function (e) {  // Get the chal that's currently there
                        return e.id == curr_chal;
                    })[0];

                    // Finding a new state for the old challenge
                    for (var i = 0; i < state_keys.length; i++) {
                        var state_asked = state_keys[i];
                        if ($.inArray(state_asked, states_used) == -1){
                            chal_areas[state_asked] = {
                                value: curr_chal.category,
                                tooltip: {content: "<span style=\"font-weight:bold;\">{0} {1}: {2}</span>".format(curr_chal.category, parseInt(curr_chal.value), curr_chal.name)}
                            };
                            states_used.push(state_asked);
                            states[ state_keys[chal.id - 1] ] = 0;
                            states[state_asked] = curr_chal.id
                        }
                    }

                    // Insert the challenge into the previous area
                    chal_areas[tag] = {
                        value: chal.category,
                        tooltip: {content: "<span style=\"font-weight:bold;\">{0} {1}: {2}</span>".format(chal.category, parseInt(chal.value), chal.name)}
                    };
                    states_used.push(tag);
                    states[tag] = chal.id
                    chals_used.push(chal.id);
                }
            });

            if ($.inArray(chal.id, chals_used) == -1){ // This challenge needs a state
                var state_asked = state_keys[chal.id - 1];
                if ($.inArray(state_asked, states_used) == -1){ // The default state is not in use
                    chal_areas[state_asked] = {
                        value: chal.category,
                        tooltip: {content: "<span style=\"font-weight:bold;\">{0} {1}: {2}</span>".format(chal.category, parseInt(chal.value), chal.name)}
                    };
                    states_used.push(state_asked);
                    states[state_asked] = chal.id
                    chals_used.push(chal.id);
                } else { // The default state is already in use
                    for (var i = 0; i < state_keys.length; i++) {
                        var state_asked = state_keys[i];
                        if ($.inArray(state_asked, states_used) == -1){
                            chal_areas[state_asked] = {
                                value: chal.category,
                                tooltip: {content: "<span style=\"font-weight:bold;\">{0} {1}: {2}</span>".format(chal.category, parseInt(chal.value), chal.name)}
                            };
                            states_used.push(state_asked);
                            states[state_asked] = chal.id
                            chals_used.push(chal.id);
                        }
                    }
                }
            }

        }

        for (var i = 0; i <= categories.length - 1; i++){
            category_colors.push({
                attrs: {
                    fill: colorhash_s(categories[i])
                },
                label: categories[i],
                sliceValue: categories[i]
            });
        }

        var load_location_hash = function () {
            if (window.location.hash.length > 0) {
                loadchalbyname(window.location.hash.substring(1));
                $("#chal-window").modal("show");
            }
        };

        $("#challenges-board").mapael({
            map: {
                name: "usa_states",
                // zoom: {
                //     enabled: true
                // },
                defaultArea: {
                    attrs: {
                        fill: "#eee",
                        stroke: "#ddd",
                        cursor: "pointer"
                    },
                    text: {
                        attrs : {"font-size": 10, "font-family": "Arial, Helvetica, sans-serif"},
                        attrsHover: {"font-size": 14, "font-family": "Arial, Helvetica, sans-serif"}
                    },
                    attrsHover: {
                        animDuration: 200,
                        fill: "#555",
                    },
                    eventHandlers: {
                        click: function (e, id, mapElem, textElem) {
                            if ($.inArray(id, states_used) == -1)
                                return;
                            var chalid = states[id];
                            loadchal(chalid);
                            $("#chal-window").modal("show");
                        }
                    }
                }
            },
            legend: {
                area: {
                    title: "Categories",
                    slices: category_colors
                }
            },
            areas: chal_areas,
        });

        updatesolves(load_location_hash);
        marksolves();

    });
}


$('#submit-key').click(function (e) {
    submitkey($('#chal-id').val(), $('#answer-input').val(), $('#nonce').val())
});

$('.chal-solves').click(function (e) {
    getsolves($('#chal-id').val())
});

$('#chal-window').on('hide.bs.modal', function (event) {
    $("#answer-input").removeClass("wrong");
    $("#answer-input").removeClass("correct");
    $("#incorrect-key").slideUp();
    $("#correct-key").slideUp();
    $("#already-solved").slideUp();
    $("#too-fast").slideUp();
});

// $.distint(array)
// Unique elements in array
$.extend({
    distinct : function(anArray) {
       var result = [];
       $.each(anArray, function(i,v){
           if ($.inArray(v, result) == -1) result.push(v);
       });
       return result;
    }
});

function colorhash (x) {
    color = "";
    var start = x/8
    for (var i = start; i <= x; i+=start){
        color += i.toString(16).replace(/\W/g, '')
        if (color.length >= 6){
            break;
        }
    };
    return "#" + color.substring(0, 6);
}

function colorhash_s(s){
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
        hash += s.charCodeAt(i);
    }
    return colorhash(hash);
}

function update(){
    // loadchals();
    loadchals_to_states();
}

$(function() {
    // loadchals();
    loadchals_to_states();
});

$('.nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show')
})

$('#chal-window').on('hidden.bs.modal', function() {
    $('.nav-tabs a:first').tab('show');
    history.replaceState('', document.title, window.location.pathname);
});

setInterval(update, 300000);
