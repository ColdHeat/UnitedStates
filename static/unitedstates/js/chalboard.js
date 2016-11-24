var challenges;

// States are ordered in the order by which they joined the union.
var states = ['DE', 'PA', 'NJ', 'GA', 'CT', 'MA', 'MD', 'SC',
    'NH', 'VA', 'NY', 'NC', 'RI', 'VT', 'KY', 'TN', 'OH', 'LA',
    'IN', 'MS', 'IL', 'AL', 'ME', 'MO', 'AR', 'MI', 'FL', 'TX',
    'IA', 'WI', 'CA', 'MN', 'OR', 'KS', 'WV', 'NV', 'NE', 'CO',
    'ND', 'SD', 'MT', 'WA', 'ID', 'WY', 'UT', 'OK', 'NM', 'AZ',
    'AK', 'HI'];


function loadchal(id) {
    var obj = $.grep(challenges['game'], function (e) {
        return e.id == id;
    })[0];

    console.log(obj);
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

        console.log(solves);

        for (var i = 0; i < chals.length; i++) {
            var obj = $.grep(challenges['game'], function (e) {
                return e.name == chals[i];
            })[0];
            obj.solves = solves[chals[i]];
            console.log(obj);
        };
        console.log(challenges);
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

// function loadchals() {
//     $.get(script_root + "/chals", function (data) {
//         var categories = [];
//         challenges = $.parseJSON(JSON.stringify(data));
//
//         $('#challenges-board').html("");
//
//         for (var i = challenges['game'].length - 1; i >= 0; i--) {
//             challenges['game'][i].solves = 0
//             if ($.inArray(challenges['game'][i].category, categories) == -1) {
//                 var category = challenges['game'][i].category;
//                 categories.push(category);
//
//                 var categoryid = category.replace(/ /g,"-").hashCode();
//                 var categoryrow = $('' +
//                     '<div id="{0}-row">'.format(categoryid) +
//                         '<div class="category-header col-md-2">' +
//                         '</div>' +
//                         '<div class="category-challenges col-md-12">' +
//                             '<div class="chal-row"></div>' +
//                         '</div>' +
//                     '</div>');
//                 categoryrow.find(".category-header").append($("<h3>"+ category +"</h3>"));
//
//                 $('#challenges-board').append(categoryrow);
//             }
//         };
//
//         for (var i = 0; i <= challenges['game'].length - 1; i++) {
//             var chalinfo = challenges['game'][i];
//             var challenge = chalinfo.category.replace(/ /g,"-").hashCode();
//             var chalid = chalinfo.name.replace(/ /g,"-").hashCode();
//             var catid = chalinfo.category.replace(/ /g,"-").hashCode();
//             var chalwrap = $("<div id='{0}' class='challenge-wrapper col-md-2'></div>".format(chalid));
//             var chalbutton = $("<button class='challenge-button trigger theme-background hide-text' value='{0}' data-toggle='modal' data-target='#chal-window'></div>".format(chalinfo.id));
//             var chalheader = $("<h5>{0}</h5>".format(chalinfo.name));
//             var chalscore = $("<span>{0}</span>".format(chalinfo.value));
//             chalbutton.append(chalheader);
//             chalbutton.append(chalscore);
//             chalwrap.append(chalbutton);
//
//             $("#"+ catid +"-row").find(".category-challenges > .chal-row").append(chalwrap);
//         };
//
//         var load_location_hash = function () {
//             if (window.location.hash.length > 0) {
//                 loadchalbyname(window.location.hash.substring(1));
//                 $("#chal-window").modal("show");
//             }
//         };
//
//         updatesolves(load_location_hash);
//         marksolves();
//
//         $('.challenge-button').click(function (e) {
//             loadchal(this.value);
//         });
//     });
// }


function loadchals_to_states(){
    $.get(script_root + "/chals", function (data) {
        challenges = $.parseJSON(JSON.stringify(data));
        console.log(challenges);

        var categories = [];
        var category_colors = [];
        var statelabels = {};
        var chal_areas = {};

        for (var i = 0; i <= challenges['game'].length - 1; i++){
            var chal = challenges['game'][i];
            console.log(states[i]);

            if ($.inArray(challenges['game'][i].category, categories) == -1) {
                var category = challenges['game'][i].category;
                categories.push(category);
            }

            chal_areas[states[chal.id - 1]] = { // This -1 is done to align the DB id's with the state indexes in the array.
                value: chal.category,
                tooltip: {content: "<span style=\"font-weight:bold;\">{0} {1}: {2}</span>".format(chal.category, parseInt(chal.value), chal.name)}
            };

            statelabels[states[i]] = parseInt(chal.value);
        }

        for (var i = 0; i <= categories.length - 1; i++){
            console.log(categories[i]);
            category_colors.push({
                attrs: {
                    fill: colorhash_s(categories[i])
                },
                label: categories[i],
                sliceValue: categories[i]
            });
        }

        console.log(category_colors);

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
                            var chalid = states.indexOf(id) + 1;
                            console.log(states.indexOf(id));
                            console.log(chalid);
                            loadchal(chalid);
                            $("#chal-window").modal("show");
                            console.log(id);
                            console.log(mapElem);
                            console.log(textElem);
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
    console.log(x);
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
