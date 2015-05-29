/**

;(function(){
    // do nothing
}());
*/
/**
 *
 * @returns {{add: Function, read: Function, erase: Function}}
 */
window.cookJar = function() {
    var jr = {
        add: function(name,value,days) {
            if (days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                var expires = "; expires="+date.toGMTString();
            }
            else var expires = "";
            document.cookie = name+"="+value+expires+"; path=/";
        },
        read: function(name) {
            var c, nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },
        erase: function(name) {
            createCookie(name,"",-1);
        }
    }
    return jr;
}

window.clips = {
    loadAttempts: 0,
    intervalId: null,
    brew: function() {
        var me = this;

    console.log(me.loadAttempts);
        this.intervalId = window.setInterval(function(me) {
            if (window.clips.initalized == true || window.clips.loadAttempts > 10) {
                window.clearInterval(this.intervalId);
                return this;
            }
            window.clips.loadAttempts++;
            window.clips.docHoliday('holster');
        }, 3000);
    },
    currentStudent: null,
    currentQuestionSection: 0,
    /**
     * Store a reference to the element in the Document Object Model for dumping
     * the innerHTML content of a particular Question Section
     */
    targetDOMEl: null,
    //TODO init
    dbh: null,
    demarkBegin : "{{",
    demarkEnd : "}}",
    getSection: function() {
        //TODO afford for back and forth : see load section§§
    },
    questionKeywordsBold: function(strs, question) {
        if (!question.keywords || question.keywords.length <= 0 || (question.keywords.length == 1 && question.keywords[0] == '')) return strs;

        for (i in question.keywords) {
            strs = strs.replace(question.keywords[i], '<b>' + question.keywords[i] +'</b>');
        }
        return strs;
    },
    /**
     * toHtml takes a question object and parses the currently selected student's properties (age, gender,
     *      possessive pronouns, et cetera and adds option fields) using transmutation into an HTML form question.
     * @param res - question object
     * @returns {string}
     */
    toHTML: function(res) {
        var sOut, txt, transmute = "",
            clsr = -1,
            //TODO handle lack of formatted
            orig = '' + res.formatted,
            parts = orig.split(this.demarkBegin);
        if (orig === 'undefined' && '' === orig.trim()) return 'Missing text for question ' + res.id + '<br/> ' +
        res.original + "\n";

        orig = this.questionKeywordsBold(orig, res);
        for(part in parts){
            txt = parts[part];
            clsr = txt.indexOf(this.demarkEnd);
            if (clsr>0) {
                transmute = txt.substring(0, clsr);
                txt = window.clips.database.transmutate(transmute, res);
                orig = orig.replace(this.demarkBegin + transmute + this.demarkEnd, txt);
            }
        }
        res.formattedHTML = orig;
        return orig;
    },
    templates: {
        questionsGroup: function(contents) {
          return '<div class="questionGroup">' + contents + '</div>' + "\n";
        },
        questionItem: function(contents) {
          return '<div class="checkbox pn-' + contents.weight + '"><lable for="question-' + contents.id + '"><input type="checkbox" name="question-' + contents.id
            + '"> ' + contents.formattedHTML + "</label></div>\n";

        },
        questionSectionList: function(contentItems) {
            var ret = '<ul class="questionSections">' + "\n";
            var tag = '';
            for (i in contentItems) {
                tag = 'sectionId-' + contentItems[i].id;
                ret += '<li id="' + tag + '">' +

                '<button class="sectionselect " onclick="clips.loadSection(' + i + ');">' +
                contentItems[i].title + ' ' +
                '(' + (contentItems[i].questions.length) + ')' +
                '</button>' +
                '</li>' + "\n";
            }
            ret += '</ul>' + "\n";
            return ret;
        }
    },
    getCurrentQuestionSection: function() {
        return this.dbh.getQuestionsBySection(this.currentQuestionSection);
        var ret = {title:'', description: '', questions: []};
        var list = this.dbh.questionSection[this.currentQuestionSection];
        for (i in list.questions) {
            ret.questions.push(this.dbh.questions[i]);
        }
        ret.title = list.title;
        ret.description = list.description;
        return ret;
    },
    sectionBack: function() {
        var pos = this.currentQuestionSection - 1;
        if (pos > -1) {
            this.currentQuestionSection = pos;
            this.docHoliday(this.targetDOMEl);
        }
    },
    sectionForward: function() {
        var pos = 1 + this.currentQuestionSection;
        if (pos <= this.dbh.questionSection.length) {
            this.currentQuestionSection = pos;
            this.docHoliday(this.targetDOMEl);
        }
    },
    loadSection: function(num) {
        if (-1 < num <= this.dbh.questionSection.length) {
            this.currentQuestionSection = num;
            this.docHoliday(this.targetDOMEl);
        }
    },
    /**
     * docHoliday - Where the gunslinging holiday begins when starting a student's report
     * @param targ string representing the target container for the questions
     */
    docHoliday: function(targ) {
        // Change this, make it a create element and just put it in
        // the bloody document, when the templates are done; meanwhile
        // TODO Refactor the creation / registration
        if (targ !== undefined && targ != this.targetDOMEl) {
            if (typeof targ === 'string') {
                if (this.targetDOMEl == null || this.targetDOMEl.id !== targ) targ = document.getElementById(targ);
                if (!targ) return this;
            }
            this.targetDOMEl = targ;
            this.initalized = true;
        } else {
            //return this;
        }

        //TODO move the init
        this.dbh = clips.database;
        //TODO interate through questions.section array
        var data = this.dbh;
        var dit;

        //TODO check for existence
        targ.innerHTML = '';

        var bandolier = this.getCurrentQuestionSection();

        targ.innerHTML += '<h1>' + bandolier.title + '</h1>' +
        '<p class="description">' + bandolier.description + "</p>";
        targ.innerHTML += '<p class="qgrp' + bandolier.id +'">';
        for (var i = 0; i < bandolier.questions.length; i++) { //data.questions.length
            //dit = data.questions[i];
            dit = bandolier.questions[i];
            this.toHTML(dit);
            //document.write(dit.formatted + "<br/>");
            targ.innerHTML +=  this.templates.questionItem(dit);
        }

        //TODO When this logic is moved to a different section REFACTOR
        // if (this.initalized == true) don't
        var listDOMEl = document.getElementById('whiskey');
        var qList = this.dbh.getQuestionSectionListing();
        var qListHTML = this.templates.questionSectionList(qList);
        if (listDOMEl !== undefined) {
            listDOMEl.innerHTML = qListHTML;
        } else {
            targ.innerHTML += qListHTML;
        }
    }
};

window.clips.database = {
    person : [{
        id: 1,
        /* 0 female, 1 male, 2 other  */
        gender: 0,
        title: "Mrs.",
        name_first: "Trisha",
        name_middle: "van de",
        name_last: "Helkat",
        email: "validate@email.io",
        birth: "2015-05-01",
        languages: [
            'en',
            'cn',
            'my'
        ]
    }],
    institute : [{
        id : 1,
        name : "Rainbow Street School",
        address1: "Rainbow Drive",
        number: "8",
        address2: "",
        country: "",
        geolocation: "",
        address_postal1: "",
        number_postal: "",
        address_postal2: "",
        country_postal: ""
    }],
    class: {
        id: 1,
        year: "2015-01-01",
        grade: 3
    },
    teacher : {
        id: 1,
        institute_id : 1,
        person_id: 1,
        experience_years: 5,
        degree: "Bachelors in Early Education"
    },
    student : {
        id: 1,
        person_id: 2,
        teacher_id: 1,
        institute_id: 1,
        class_id: 1,
        results: [
            1
        ]
    },
    transmutations: {
            Possessive: function() {
              return "His";
            },
            possessive: function() {
                //["his","her"]
                return "his";
            },
            fullname: function() {
                return "Lee Kuan";
            },
            Gender: function () {
              return "He";
            },
            gender: function () {
                return "he";
                //["he","she"]
            }
    },

    /**
     *
     * @param key - The keyword being translated {gender, possessive, option, name}
     * @param res - Test question object
     */
    transmutate: function(key, res) {
      switch(key) {
          case 'possessive':
              return this.transmutations.possessive(res);
          case 'Possessive':
              return this.transmutations.Possessive(res);
          case 'name':
              return this.transmutations.fullname(res);
          case 'gender':
              return this.transmutations.gender(0);
          case 'Gender':
              return this.transmutations.Gender(0);
          case 'option':
              return this.getOptionHTML(res);
              break;
          default :
              return this;
      }
        return this;
    },
    getOptionHTML: function(res) {
        //TODO Refactor
        var list = '<select name="' + res.id + '">' + "\n";

        for (i in res.options) {
          list += '<option value="' + res.options[i].grade + '">' + res.options[i].text;
          list += '</option>' + "\n";
        };
        list += "</select>\n";
        return list;
    },
    questionSectionInterface: function() {
        return {
            id: -1,
                title: 'Section Title not set!',
            description: 'Section Description not set!',
            questions: []
        };
    },
    questionSection: [{
        id: 0,
        title: "Introductory Comments: General",
        description: "Select which sentence(s) to be included your introductory comments for the current student's evaluation. " +
        "Eventually, we will welcome your own custom comments within this framework, with an option to contribute and make " +
        "your suggestions a permanent part of the system.<br/>" +
        "Note: Keywords are provided in bold to increase the speed at which you can process the statements grouped in sections.",
        questions: [
            1,
            2,
            3
        ]
    },{
        id: 1,
        title: "Introductory Comments: Very Positive",
        description: "",
        questions: [
            4,
            5
        ]
    },{
        id: 2,
        title: "Introductory Comments: Positive",
        description: "",
        questions: [
            6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
            31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
            51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
            61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
            71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
            81, 82, 83, 84
        ]
    },{
        id: 3,
        title: "Introductory Comments: Positive | Negative",
        description: "",
        questions: [
            85, 86, 87
        ]
    }],
    getQuestionSectionListing: function() {
        return this.questionSection;
        //TODO figure out why the heck i did this
        var ret = [];
        for (i in this.questionSection) {
           ret.push(this.getQuestionsBySection(this.questionSection[i].id));
        }
        return ret;
    },
    getQuestionsBySection: function(sectionId) {
        //var ret = {title:'', description: '', questions: []};
        var ret = new this.questionSectionInterface();
        var list = this.questionSection[sectionId];
        for (i in list.questions) {
            ret.questions.push(this.questions[i]);
        }
        //TODO apply in refactoring
        ret.title = list.title;
        ret.description = list.description;
        return ret;
    },
    getQuestionById : function(i) {;
      for (q in this.questions) {
          if (this.questions[q].id === i) {
              return this.questions[q];
              break;
          }
      }
      return this;
    },
    questions: [{
        id: 1,
        original: "• ___________ has made (some/ good/ excellent) progress this term. (G)",
        formatted : "{{name}} has made {{option}} progress this term.",
        keywords : [
            "progress"
        ],
        options: [{
            text: "excellent",
            grade: 1
        },{
            text: "good",
            grade: 0
        },{
            text: "some",
            grade: -1
        }],
        weight: 'g',
        section_id: 1
    },{
        id: 2,
        original: "• ___________ remains focused in class, but (often/ occasionally/ rarely) needs reminders to stay on task. (G)",
        formatted: "While learning in class, {{name}} {{option}} needs to be reminded to stay focused on the task at hand.",
        keywords: [
            "focus",
            "attention"
        ],
        options: [{
            text: "rarely",
            grade: 1
        },{
            text: "occasionally",
            grade: 0
        },{
            text: "often",
            grade: -1
        }],
        weight: 'g',
        section_id: 1
    },{
        id: 3,
        original: "• ___________ consistently takes responsibility for his/her own share of the work when participating " +
        "in class and group activities. He/she remains focused in class, but (often/ occasionally/ rarely) needs " +
        "reminders to stay on task. (G)",
        formatted: "When participating in class, {{name}} consistently takes responsibility for {{possessive}} own share " +
            "of work during group activities. {{Gender}} remains focused in class, {{option}} requires reminders to stay " +
            "attentive to the task at hand",
        keywords: [
            "group",
            "activities",
            "responsible",
            "responsibility",
            "focus"
        ],
        options: [{
            text: "and rarely",
            grade: 1
        },{
            text: "yet occassionally",
            grade: 0
        },{
            text: "but often",
            grade: -1
        }],
        weight: 'g',
        section_id: 1
    },{
        id: 4,
        original: "___________ is a leader in his/her class who cooperates with others and always tries to work above " +
            "and beyond the assigned tasks.",
        formatted: "{{name}} is a leader in {{possessive}} class who cooperates with others and always tries to work " +
            "above and beyond the assigned tasks.",
        keywords: [
            "leader",
            "leadership",
            "beyond",
            "with others"
        ],
        options: [],
        weight: 'pp',
        section_id: 2
    },{
        id: 5,
        original: "___________ is a highly motivated student who participates in class activities with creativity " +
            "and great deal of enthusiasm. His/her willingness to lead, organize and inspire others is well noted.",
        formatted: "{{name}} is a highly motivated student who participates in class activities with creativity " +
            "and great deal of enthusiasm. {{Possessive}} willingness to lead, organize and inspire others is well noted.",
        keywords: [
            "highly motivated",
            "lead",
            "enthusiasm",
            "orgainize",
            "inspire"
        ],
        options: [],
        weight: 'pp',
        section_id: 2
    },{
        id: 6,
        original: "___________’s work often exhibits thought and care. (P)",
        formatted: "The work that {{name}} is producing often exhibits thought and care.",
        keywords: [
            "often",
            "exhibits",
            "thought",
            "care"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 7,
        original: "• ___________ works well independently and with others. (P)",
        formatted: "{{name}} is able to work equally well with others as {{gender}} can do so independently.",
        keywords: [
            "well",
            "independent",
            "with others"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 8,
        original: "• ___________ consistently participates in class and group activities. (P)",
        formatted: "When it comes to class and group activities, {{name}} is consistently participating.",
        keywords: [
            "consistently",
            "group",
            "activities",
            "particitpating",
            "particpation"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 9,
        original: "• ___________ shows self-direction in goal setting and goal achievement. (P)",
        formatted: "In setting goals and in goal achievement, {{name}} displays assertive self-direction.",
        keywords: [
            "setting",
            "goal",
            "achievement",
            "self-direction",
            "assertive"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 10,
        original: "• ___________ shows (continues to demonstrate) a keen interest in learning. (P)",
        formatted: "{{name}} continues to demonstrate a very keen interest in learning.",
        keywords: [
            "interest",
            "learning",
            "motivated",
            "keen"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 11,
        original: "• ___________ shows effective time management and organizational skills. (P)",
        formatted: "{{name}} displays efficient organizational skills and these prove to be a catalyst to " +
            "{{possessive}} use of time management",
        keywords: [
            "organizational skills",
            "time management"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 12,
        original: "• ___________ is a co-operative student who works well with other classmates. (P)",
        formatted: "With good cooperative skills, {{name}} works very well with {{possessive}} other classmates. ",
        keywords: [
            "cooperative",
            "skills",
            "classmates"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 13,
        original: "• ___________ has put forth a consistent effort in all areas of his/her work this term. (P)",
        formatted: "In all areas of {{possessive}} work efforts this term, {{name}} has remained quite consistent.",
        keywords: [
            "all areas",
            "work",
            "effort",
            "consistent"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 14,
        original: "• ___________ consistently builds/forms positive relationships with peers and adults. (P)",
        formatted: "With both peers, as with adults, {{name}} consistently forms positive relationships.",
        keywords: [
            "peers",
            "adults",
            "forms",
            "positive",
            "relationships"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 15,
        original: "• ___________ has been a very helpful, courteous, polite and hard working student.(P)",
        formatted: "It is enjoyable to work with {{name}}, as {{gender}} is very helpful, courteous, assiduous and " +
            "a hard working student.",
        keywords: [
            "courteous",
            "polite",
            "considerate",
            "hard working",
            "assiduous"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 16,
        original: "• ___________’s enthusiasm for learning is reflected in his/her effort to do things well. (P)",
        formatted: "{{Possessive}} enthusiasm for learning is reflected in {{name}}'s effort to accomplish tasks " +
            "in an exceptional manner.",
        keywords: [
            "exceptional",
            "enthusiasm",
            "learning"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 17,
        original: "• ___________ shows good leadership skills when working with classmates in groups. (P)",
        formatted: "{{name}} shows good leadership skills when working with classmates in groups.",
        keywords: [
            "leadership",
            "classmates",
            "groups"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 18,
        original: "• ___________ has made a good adjustment to his/her new school in a short period of time. (P)",
        formatted: "To acclimatize to a new school is a challenge for students, but I am happy to report that {{gender}} " +
        "has adjusted well in a short period of time.",
        keywords: [
            "new school",
            "adjusted",
            "well"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 19,
        original: "• ___________ continues to work well independently and shows good motivation in class. (P)",
        formatted: "{{Gender}} continues to work well independently and shows {{possessive}} inspirational motivation in class.",
        keywords: [
            "motivation",
            "independent",
            "work well"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 20,
        original: "• ___________ is a very considerate student who enjoys learning and works well with others. (P)",
        formatted: "{{Gender}} is a very considerate student. {{name}} appears to enjoy learning and works well with others",
        keywords: [
            "considerate",
            "with",
            "others",
            "enjoys",
            "learning"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 21,
        original: "• ___________ is a cooperative, pleasant and quiet student who is genuinely motivated to learn. (P)",
        formatted: "Among {{name}}'s attributes, one could site that {{gender}} is; cooperative, pleasant and reserved. " +
            "{{Gender}} is genuinely motivated to learn.",
        keywords: [
            "cooperative",
            "pleasant",
            "quiet",
            "reserved",
            "motivated"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 22,
        original: "• ___________ has experienced successful integration in several academic subjects this term. (P)",
        formatted: "There have been numerous academic subjects in this term and overall {{name}} has managed " +
            "to grasp and absorb in most fields.",
        keywords: [
            "numerous",
            "academic",
            "subjects",
            "integration",
            "subjects",
            "grasp",
            "absorb"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 23,
        original: "• ___________ is an enthusiastic learner who enjoys group activities and socializing with his/her peers. (P)",
        formatted: "{{name}} is an enthusiastic learner who truly seems to enjoy group activities and " +
            "socializing with {{possessive}} peers.",
        keywords: [
            "enthusiastic",
            "group",
            "activities",
            "socializing"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 24,
        original: "• Diligent work habits and exemplary behavior have contributed to this term’s good achievement. (P)",
        formatted: "Diligent work habits and exemplary behavior have contributed to {{possessive}} achievements this term.",
        keywords: [
            "exemplary",
            "behavior",
            "Diligent",
            "diligent",
            "work habits"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 25,
        original: "• ___________ works well co-operatively and independently to achieve (his/her) academic goals. (P)",
        formatted: "{{name}} works well both cooperatively and independently while achieving {{possessive}} academic goals.",
        keywords: [
            "independent",
            "cooperative",
            "group",
            "groups"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 26,
        original: "• ___________ has maintained excellent progress this term. Self-motivation to learn has been quite evident. (P)",
        formatted: "An integral inner-will to make progress appears to be {{name}}'s primary motive that has perpetuated {{possessive}} " +
            "consistently maintaining admirable levels improvement.",
        keywords: [
            "inner-will",
            "motivation",
            "consistent",
            "drive",
            "admiral"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 27,
        original: "• ___________ actively participates in class and demonstrates leadership in a wide range of learning activities. (P)",
        formatted: "{{Gender}} actively participates in class and demonstrates leadership in a wide range of learning activities.",
        keywords: [
            "active",
            "participation",
            "participates",
            "leadership"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 28,
        original: "• ___________ usually follows classroom routines and instructions independently, and puts forth a good effort. (P)",
        formatted: "Primarily, {{name}} follows the classroom routines and instructions in an independent manner. {{Possessive}} " +
            "good effort has not gone unnoticed.",
        keywords: [
            "independent",
            "good",
            "effort"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 29,
        original: "• ___________ shows self-direction in learning and usually completes homework on time and with care. (P)",
        formatted: "{{Gender}} most often completes {{possessive}} homework in a caring and punctual manner; showing great " +
            "self-determination.",
        keywords: [
            "self-determined",
            "self-determination",
            "homework",
            "punctual",
            "timely"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 30,
        original: "• ___________ follows classroom and school routines, shares materials and equipment, and plays cooperatively with others. (P)",
        formatted: "Among {{possessive}} admiral social skills, {{name}} follows the classroom's routines, shares their materials and equipment " +
            "with other students, and plays in a cooperative manner with classmates.",
        keywords: [
            "social",
            "social skills",
            "sharing",
            "group",
            "cooperative",
            "shares"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 31,
        original: "• ___________ possesses strong leadership potential and is encouraged to provide leadership in a variety of groupings. (P)",
        formatted: "{{Gender}} possess an strong leadership potential, and within a variety of group activities, {{name}} is " +
            "encouraged to partake in a leadership role.",
        keywords: [
            "leadership",
            "potential",
            "group",
            "social"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 32,
        original: "• ___________ demonstrates a genuine concern for learning and approaches given tasks with a sincere desire to succeed. (P)",
        formatted: "{{name}} appears to have a vested interest in learning and approaches {{possessive}} tasks with a genuine desire to succeed.",
        keywords: [
            "genuine",
            "interest",
            "in learning",
            "goal driven"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 33,
        original: "• A conscientious individual, ___________ has set goals for personal achievement and is working diligently to attain them. (P)",
        formatted: "During the term, {{name}} has carried a conscientious and goal driven disposition. {{Gender}} sets goals for {{possessive}} personal " +
            "levels of achievement and {{gender}} has been exercising diligence in attaining those goals.",
        keywords: [
            "considerate",
            "conscientious",
            "diligent",
            "diligence",
            "achievement",
            "goal driven",
            "goal oriented"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 34,
        original: "• ___________’s positive and consistent efforts toward school and learning activities have resulted in a very successful year. (P)",
        formatted: "It has been a most successful year and this is in part due to {{name}}'s consistent efforts towards " +
            "the school and the classroom's learning activities and {{possessive}} positive disposition.",
        keywords: [
            "consistent",
            "positive",
            "disposition",
            "successful"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 35,
        original: "• ___________ continues to be a cooperative and constructive member in group activities who is well liked by his/her peers. (P)",
        formatted: "{{name}} remains a cooperative and constructive member of group activities. {{Gender}} is popular and very well liked by {{possessive}} peers.",
        keywords: [
            "cooperative",
            "constructive",
            "social",
            "popular",
            "group",
            "activities"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 36,
        original: "• ___________ approaches new learning opportunities with confidence and demonstrates a positive attitude toward learning. (P)",
        formatted: "{{name}} approaches new learning opportunities with confidence and {{gender}} demonstrates a positive " +
        "attitude toward learning.",
        keywords: [
            "confident",
            "confidence",
            "positive",
            "attitude"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 37,
        original: "• ___________ always completes his/her work independently. ___________ welcomes new tasks and seeks new opportunities for learning. (P)",
        formatted: "{{Gender}} always completes {{possessive}} work independently. {{name}} enjoys getting new tasks and " +
            "seeks new opportunities in learning.",
        keywords: [
            "independent",
            "enjoy",
            "new tasks"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 38,
        original: "• ___________ continues to be a conscientious, cheerful student who assumes volunteer positions to aid his/her peers and teachers. (P)",
        formatted: "{{name}} is a conscientious and cheerful student who often volunteers {{possessive}} efforts to aid peers and teachers.",
        keywords: [
            "conscientious",
            "cheerful",
            "volunteer",
            "group",
            "social"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 39,
        original: "• ___________ is an exemplary student whose considerate manners and happy, friendly demeanor have earned him/her many friends among peers. (P)",
        formatted: "{{Gender}} has an exemplary considerate mannerism, jovial disposition and friendly demeanor. These qualities have " +
            "earned {{name}} a considerably healthy number of friends among peers.",
        keywords: [
            "happy",
            "jovial",
            "considerate",
            "friends",
            "social",
            "number of"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 40,
        original: "• ___________ recognizes where and how assignments would benefit from additional information. He/she integrates learning " +
            "from various subject areas. (P)",
        formatted: "{{Gender}} was able to assimilate and integrate information from the various subjects covered in this past term.",
        keywords: [
            "assimilate",
            "integrate",
            "adaptive"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 41,
        original: "• ___________ is a motivated, happy learner who enjoys being with his/her peers and working on group projects. ___________ " +
        "participates well in class. (P)",
        formatted: "When it comes to class participation, {{name}} most integrally involved. {{Gender}} is a very happy student and " +
            "enjoys working with {{possessive}} peers in group projects.",
        keywords: [
            "happy",
            "integral",
            "involved",
            "participation"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 42,
        original: "• ___________ continues to strive to do his/her best in all areas of learning. He/she works well with limited supervision and " +
        "uses his/her time effectively. (P)",
        formatted: "{{name}} continues to strive towards doing {{possessive}} best in all areas of learning. {{Gender}} works well with " +
            "limited supervision and uses {{possessive}} time effectively.",
        keywords: [
            "best",
            "all areas of learning",
            "limited",
            "supervision"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 43,
        original: "• ___________ is a conscientious student who always completes tasks accurately and with care. He/she works well independently " +
        "and in a group setting. (P)",
        formatted: "{{name}} is a conscientious student who always completes {{possessive}} tasks accurately and with care. {{Gender}} works well " +
            "independently and within group settings.",
        keywords: [
            "conscientious",
            "accurate",
            "care",
            "independent",
            "group"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 44,
        original: "• ___________ is a quiet independent student who uses class time well. His/her classmates value him/her as a thoughtful, " +
        "productive member of any (the) group. (P)",
        formatted: "{{name}}'s classmates value {{possessive}} efforts in group settings. {{Gender}} is seen as a quiet, independent, thoughtful and productive member.",
        keywords: [
            "quiet",
            "independent",
            "thoughtful",
            "productive"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 45,
        original: "• ___________ consistently listens and respects the opinions of others. ___________ communicates effectively and contributes " +
        "information to the class and group members. (P)",
        formatted: "With particular attention to {{name}}'s listening skills, {{gender}} shows respect for the opinions of others, communicates effectively " +
            "and contributes information to the classmates in group settings.",
        keywords: [
            "listening",
            "respect",
            "communicate",
            "effective",
            "contributes",
            "group"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 46,
        original: "• ___________ willingly works with others. He/she shows respect for ideas of others in our class. (P)",
        formatted: "{{name}} enjoys working with others in a group and {{gender}} shows respect for their ideas and opinions.",
        keywords: [
            "shows",
            "respect",
            "group"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 47,
        original: "• ___________ follows routines and instructions independently. He/she sometimes solves problems independently. (P)",
        formatted: "{{name}} follows routines and instructions in an independent manner and {{gender}} sometimes solves problems independently.",
        keywords: [
            "routine",
            "independently",
            "independent"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 48,
        original: "• ___________ participates enthusiastically in class activities and follows classroom and school procedures consistently. (P)",
        formatted: "With enthusiasm, {{name}} participates in class activities and follows the classroom's procedures consistently.",
        keywords: [
            "consistent",
            "enthusiasm",
            "procedures"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 49,
        original: "• ___________ communicates well with class and group members. He/she often interprets and understands problems. (P)",
        formatted: "{{name}} communicates well with class and group members. {{Gender}} often interprets and understands problems.",
        keywords: [
            "understands",
            "problems",
            "communicates",
            "well",
            "group"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 50,
        original: "• ___________ shows motivation and self-confidence. He/she consistently uses his/ her time effectively and remains on task. (P)",
        formatted: "Highly motivated and self-confident, {{name}} consistently uses {{possessive}} time effectively and remains focused on the task at hand.",
        keywords: [
            "motivation",
            "focus",
            "self-confident",
            "motivated",
            "consistent"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 51,
        original: "• ___________ shows motivation and self-confidence. He/she puts forth a consistent effort and seeks positive solutions to conflict. (P)",
        formatted: "Highly motivated and self-confident, {{name}} puts forward consistent effort and seeks positive solutions to conflicts.",
        keywords: [
            "conflict",
            "positive",
            "motivation",
            "focus",
            "self-confident",
            "motivated",
            "consistent"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 52,
        original: "• ___________ usually works willingly and collaboratively with others . He/she contributes information and ideas to the class. (P)",
        formatted: "{{name}} usually works willingly and collaboratively with others. {{Gender}} contributes information and {{possessive}} ideas to the class.",
        keywords: [
            "willing",
            "collaborative",
            "contributes"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 53,
        original: "• ___________ effectively interprets and synthesizes information and always participates in class with eagerness and enthusiasm. (P)",
        formatted: "{{name}} effectively interprets and synthesizes new information. {{Gender}} always participates in class with a sense of eagerness and enthusiasm.",
        keywords: [
            "eagerness",
            "enthusiasm",
            "synthesizes",
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 54,
        original: "• ___________ often participates in class and group activities. ___________ asks questions to clarify meaning and ensure understanding. (P)",
        formatted: "Most often, {{name}} participates in class and group activities, and {{gender}} is quiet inquisitive when seeking clarification and ensure their understanding.",
        keywords: [
            "understanding",
            "clarification",
            "inquisitive",
            "participates",
            "group",
            "activities"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 55,
        original: "• ___________ reading and writing skills are improving slowly. ___________ is showing increased willingness to focus and " +
        "complete assigned work in class. (P)",
        formatted: "Both reading and writing skills are gradually improving. {{name}} is showing increased interest in holding {{possessive}} focus and completing the assigned work in class.",
        keywords: [
            "reading",
            "writing",
            "increased",
            "interest",
            "focus"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 56,
        original: "• ___________ accepts various roles within the class and group, including leadership. He/she asks questions to clarify " +
        "meaning and works willingly with others. (P)",
        formatted: "When it comes to the various roles one could take within both class and group activities, {{name}} accepts has no problem " +
        "assuming a leadership role. {{Gender}} is inquisitive when seeking clarification and works willingly with others.",
        keywords: [
            "group",
            "various",
            "roles",
            "leadership",
            "inquisitive",
            "works",
            "with others"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 57,
        original: "• ___________ continues to show improvement on most of his/her programs. He/she shares his/her ideas and research skills in " +
        "preparing for group presentations. (P)",
        formatted: "{{name}} continues to show improvement on most of {{possessive}} programs. {{Gender}} shares {{possessive}} ideas and research skills in " +
            "preparing for group presentations.",
        keywords: [
            "improvement",
            "research",
            "skills",
            "group",
            "presentation"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 58,
        original: "• ____________ shows motivation, initiative and self-direction. ___________ is encouraged to analyze and assess accurately " +
        "the value and the meaning of information. (P)",
        formatted: "Showing motivation, initiative and self-direction, {{name}} is encouraged to analyze and assess " +
            "the value and the meaning of the information at hand accurately.",
        keywords: [
            "motivation",
            "initiative",
            "self-direction"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 59,
        original: "• ___________ has adjusted well to his/her new surroundings and the ___________ program. ___________ is well accepted " +
        "by his/her peers and works well with others in small groups. (P)",
        formatted: "{{name}} has adjusted well to {{possessive}} new surroundings and the ___________ program. ___________ is well accepted " +
            "by {{possessive}} peers and works well with others in small groups.",
        keywords: [
            "new surroundings",
            "moved",
            "transfered",
            "works well",
            "groups"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 60,
        original: "• __________ accepts responsibility for completing tasks on time and with care. ___________ works well without " +
        "supervision. ___________ shows a positive attitude towards learning. (P)",
        formatted: "help",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 61,
        original: "• ___________ is a very conscientious student who forms positive relationships with peers and adults. He/she works well " +
        "in groups and always follows classroom and school procedures. (P)",
        formatted: "help",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 62,
        original: "• ___________ is a cooperative, polite class member who volunteers to help others. He/she regularly displays positive " +
        "attitude towards learning and follows classroom and school procedures. (P)",
        formatted: "help",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 63,
        original: " • ___________ consistently takes responsibility for his/her own share of the work when participating in class and " +
        "group activities. He/she remains focused and (rarely) needs reminders to stay on task. (P)",
        formatted: "help",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 64,
        original: "• ___________ shows motivation and self-confidence. ___________ puts forth a consistent effort and seeks positive solutions " +
        "to conflict. He/she is encouraged to participate in class discussions. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 65,
        original: "• ___________ is a considerate and energetic student who has adjusted (fairly) well to the routines and " +
        "expectations of the classroom. His/her willingness to lead and organize class activities is noted and appreciated. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 66,
        original: "• ___________ always accepts responsibility for completing tasks on time and with care. ___________ follows classroom " +
        "routines and instructions independently and displays a positive attitude towards learning. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 67,
        original: " • ___________’s work often exhibits thought and care. He/she works well co- operatively and independently to achieve his/her " +
        "academic goals. ___________ is encouraged to seek assistance prior to test dates. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 68,
        original: "• ___________ welcomes new tasks and seeks new opportunities for learning, especially when it involves group work. He/she has " +
        "demonstrated a positive attitude towards learning and shown (good/ excellent/ great) leadership skills. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 69,
        original: "• ___________ has successfully taken advantage of all the learning opportunities that our program had to offer this year. " +
        "He/she has worked hard throughout the year and (greatly/ impressively) contributed to the positive class atmosphere. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 70,
        original: "• ___________ is a quiet, polite member of the class. ___________ routinely and independently works well " +
        "in a group setting. ___________ displays a positive attitude towards learning, demonstrating motivation and seeking new learning opportunities. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 71,
        original: "• ___________ continues to make positive gains in the ___________ program, namely in the area of " +
        "organizational skills. ___________ now listens to teacher advice and suggestions and is making an effort to become a better organized student. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 72,
        original: "• ___________ consistently completes and submits all assignments for evaluation on time. ___________ works well " +
        "independently, shows good motivation and is a risk taker, especially when working on tasks that require problem solving and creativity. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 73,
        original: "• ___________ consistently seeks work and new opportunities for learning. He/she contributes positively to class discussions " +
        "and co-operative group activities. ___________ is encouraged to assess his/her own work and identify goals to strive for. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 74,
        original: "• ___________ is a highly motivated independent learner who is to be commended for his/her high level of achievement this term. " +
        "___________ is a role model for other students in terms of ability to focus on the task and consistent completion of work with high quality. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 75,
        original: "• ___________ (consistently/ always) completes assignments on time. He/she begins work promptly and accepts responsibility " +
        "for his/her own learning. ___________ is encouraged to participate in group and class discussions and to accept a variety of roles within the class, including leadership. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 76,
        original: "• Although a quiet individual, ___________ enjoys sharing his/her ideas and concerns with his/her classmates in small group " +
        "discussions. Throughout the (next, following, second, third ) term, ___________ is encouraged to continue to build on " +
        "his/her achievements and work on communication skills and level of self confidence. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 77,
        original: "• ___________ has established some personal challenges for his/her programs, especially in area of reading expectations. " +
        "A more conscientious individual, ___________ has set goals for his/her own achievement and is working diligently to attain them. " +
        "He/she is encouraged to maintain this positive, responsible attitude throughout the (next/ final) term. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 78,
        original: "• This term ___________ has made some gains in his/her program. He/she continues to maintain a high level of " +
        "commitment and (enthusiasm/ exuberance) towards learning. ___________ demonstrates a good ability to work independently and in groups. " +
        "___________ is encouraged to express his/her opinions more often during class discussions in order to develop his/her leadership abilities. (P)",
        formatted: "During this term, {{name}}, has shown some progress in {{possessive}} program. {{Gender}} continues to maintain " +
            "a high level of commitment and enthusiasm in the learning process. As well as independent and in groups, {{name}} demonstrates " +
        " ",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 79,
        original: "DO NOT SELECT, 79 NEEDS TO BE CREATED",
        formatted: "",
        keywords: [
            "DO NOT SELECT, 79 NEEDS TO BE CREATED"
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 80,
        original: "• ___________ approaches new challenges and tasks with motivation, eagerness and confidence. ___________ is " +
        "able to use information and different technologies effectively, and has consequently experienced a good deal of success this term. " +
        "He/ she willingly accepts various roles within the class and group situations, including the role of a leader. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 81,
        original: "• ___________ is developing suitable research skills necessary in the preparation for oral, group presentations. " +
        "He/she enjoys sharing his/her ideas and concerns in small group discussions. ___________ is encouraged to concentrate " +
        "on achieving his/her personal goals for the (next/ final) term, including a more risk-taking approach to new and challenging learning situations. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 82,
        original: "• ___________ continues to show improvement in many areas of the program this term. He/she shares his/her " +
        "ideas and research skills in preparing for group presentations. ___________ has established some personal challenges for his/her " +
        "programs, especially in area of reading expectations. A conscientious individual, ___________ has set goals for personal " +
        "achievement and is working diligently to attain them. (P)",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 83,
        original: "• ___________ has experienced good progress in many areas of programs. He/she has improved his/her level " +
        "of commitment and concentration on daily tasks and long term group and individual assignments. He/she has displayed a " +
        "more cooperative approach to both his/her work and his/her classmates. ___________ is to be congratulated on his/her " +
        "achievements, and encouraged to continue in this more positive, responsible manner throughout the final term. (P)",
        formatted: "{{name}} has experienced good progress in many areas of programs. {{Gender}} has improved {{possession}} level " +
            "of commitment and concentration on daily tasks and long term group and individual assignments. {{Gender}} has displayed a " +
            "more cooperative approach to both {{posession}} work and {{posession}} classmates. {{name}} is to be congratulated on {{possession}} " +
            "achievements, and encouraged to continue in this more positive, responsible manner throughout the final term.",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 84,
        original: "• ___________ has encountered good success in many of the programs this term. He/she uses his/her organizer " +
        "to record important information and due dates. He/she shares his/ her ideas and concerns in group and class discussions, " +
        "and is a cooperative, responsible individual. ___________ is becoming a more confident risk-taker with his/ her assignments. " +
        "Careful planning and a conscientious attitude are positive aspects of his/her class participation and behavior. " +
        "He/she is encouraged to maintain solid effort throughout the next term. (P)",
        formatted: "{{name}} has encountered good success in many of the programs this term. He/she uses his/her organizer " +
        "to record important information and due dates. {{Gender}} shares {{possession}} ideas and concerns in group and class discussions, " +
        "and is a cooperative, responsible individual. {{name}} is becoming a more confident risk-taker with {{possession}} assignments. " +
        "Careful planning and a conscientious attitude are positive aspects of {{possession}} class participation and behavior. " +
        "{{Gender}} is encouraged to maintain solid effort throughout the next term.",
        keywords: [
            ""
        ],
        options: [],
        weight: 'p',
        section_id: 2
    },{
        id: 85,
        original: "• ___________ is a considerate student who has had some difficulty adjusting to the (academic/ learning) expectations of the classroom. (P,N)",
        formatted: "{{name}} is a considerate student who has had some difficulty adjusting to the academic expectations of the classroom",
        keywords: [
            "considerate",
            "difficulty",
            "adjustment",
            "adjusting"
        ],
        options: [],
        weight: 'pn',
        section_id: 2
    },{
        id: 86,
        original: "• ___________ often contributes information and ideas to the class or group. He/she sometimes follows routines and instructions independently. (P,N)",
        formatted: "{{name}} often contributes information and ideas to the class or group. {{Gender}} sometimes follows routines and instructions  independently.",
        keywords: [
            ""
        ],
        options: [],
        weight: 'pn',
        section_id: 2
    },{
        id: 87,
        original: "• ___________ often contributes information and ideas to the class or group. He/she sometimes follows routines and instructions independently. (P,N)",
        formatted: "{{Name}} often contributes information and ideas to the class or group. He/she sometimes follows routines and instructions independently.",
        keywords: [
            ""
        ],
        options: [],
        weight: 'pn',
        section_id: 2
    },{
        id: 88,
        original: "",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'pn',
        section_id: 2
    },{
        id: 61,
        original: "",
        formatted: "",
        keywords: [
            ""
        ],
        options: [],
        weight: 'pn',
        section_id: 2
    }],
    temp: ","
};
/*
TODO
TODO
TODO



 The ⎋ key in any tool window moves the focus to the editor.
 ⇧⎋ moves the focus to the editor and also hides the current (or last active) tool window.
 The F12 key moves the focus from the editor to the last focused tool window.

 */
//window.document.addEventListener('load', window.clips.docHoliday('holster'));
clips.brew();