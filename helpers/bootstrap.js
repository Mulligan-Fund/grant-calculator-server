var bs = {
  titleBootstrap: [
    {
      title: "Administrative Assistant (Foundation)",
      salary: 51000
    },
    {
      title: "Administrative Assistant (Nonprofit)",
      salary: 32960
    },
    {
      title: "Chief Executive Officer (Nonprofit)",
      salary: 103000
    },
    {
      title: "Chief Executive Officer/President (Foundation)",
      salary: 180000
    },
    {
      title: "Chief Financial Officer (Foundation)",
      salary: 150000
    },
    {
      title: "Development Associate (Nonprofit)",
      salary: 40428
    },
    {
      title: "Director; Communications (Foundation)",
      salary: 96900
    },
    {
      title: "Director; Communications (Nonprofit)",
      salary: 66950
    },
    {
      title: "Director; Development (Nonprofit)",
      salary: 68305
    },
    {
      title: "Director; Donor Services/Donor Service Officer (Foundation)",
      salary: 79310
    },
    {
      title: "Director; Finance (Nonprofit)",
      salary: 76561
    },
    {
      title: "Director; Research (Nonprofit)",
      salary: 91340
    },
    {
      title: "General Counsel (Foundation)",
      salary: 255175
    },
    {
      title: "General Counsel (Nonprofit)",
      salary: 192560
    },
    {
      title: "Grant Writer (Nonprofit)",
      salary: 49440
    },
    {
      title: "Grants Management Assistant (Foundation)",
      salary: 57927
    },
    {
      title: "Grants Manager/Administrator (Foundation)",
      salary: 78000
    },
    {
      title: "Office Manager (Foundation)",
      salary: 61000
    },
    {
      title: "Office Manager (Nonprofit)",
      salary: 42307
    },
    {
      title: "Program Assistant (Foundation)",
      salary: 53055
    },
    {
      title: "Program Assistant (Nonprofit)",
      salary: 34803
    },
    {
      title: "Program Associate (Foundation)",
      salary: 60884
    },
    {
      title: "Program Director (Foundation)",
      salary: 135000
    },
    {
      title: "Program Director (Nonprofit)",
      salary: 59014
    },
    {
      title: "Program Manager (Nonprofit)",
      salary: 52386
    },
    {
      title: "Program Officer (Foundation)",
      salary: 89788
    },
    {
      title: "Research Director (Foundation)",
      salary: 138666
    },
    {
      title: "Senior Program Officer (Foundation)",
      salary: 127100
    },
    {
      title: "Vice President; Program (Foundation)",
      salary: 162067
    }
  ],

  templateBootstrap: [],

  init: function(mongoose, Role, Obj) {
    // Import mongoose, import Role schema
    // Bootstrap Roles
    Role.find({}, function(err, list) {
      if (err) {
        console.log("Some kind of error fetching roles", err);
      }
      if (list.length == 0) {
        var b = bs.titleBootstrap;
        console.log("Bootstrapping", b.length, "Roles");
        for (var i in b) {
          console.log("Adding Role:", b[i]);
          var role = new Role(b[i]);
          role.save(function(err, r) {
            var template = new Obj({
              userid: null,
              name: "Template: " + r.title,
              title: r.id,
              salary: r.salary,
              global: true
            });
            template.save();
          });
        }
        return;
      } else {
        console.log("No Bootstrapping");
        return;
      }
    });
  }
};

module.exports = bs;
