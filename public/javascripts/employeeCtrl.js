 var validationApp = angular.module('employeeApp', []);
 var token;
 validationApp.controller('employeeCtrl', function($scope, $http) {

     $scope.checkemail = function() {
         var data = {
             email: $scope.employee.email
         };
         $http.post('http://localhost:3000/checkEmail', data)
             .success(function(response) {
                 console.log(response);
                 if (response.success) {
                     $scope.emailExist = true;
                 } else {
                     $scope.emailExist = false;
                 }
             });
     }

     $scope.submitForm = function(form) {

         if ($scope.employeeForm.$valid && !$scope.emailExist) {
             $http.post('http://localhost:3000/employee/save', $scope.employee).success(function(response) {
                 console.log("success");
                 console.log(response);
                 $scope.employee = {};
                 angular.copy({}, $scope.employee);
                 form.$setPristine();
                 if (response.success) {
                     window.location = "http://localhost:3000/login";
                 } else {
                     alert("Something went wrong.");
                 }

             });
         }
     };

     $scope.loginForm = function(form) {

         if ($scope.employeeForm.$valid) {
             $http.post('http://localhost:3000/authenticate', $scope.employee)
                 .success(function(response) {
                     console.log("success");
                     console.log(response);
                     $scope.employee = {};
                     angular.copy({}, $scope.employee);
                     form.$setPristine();
                     //window.location = "http://localhost:3000/employee/home?token=" + response.token;
                     if (response.success) {
                         window.location = "http://localhost:3000/employee/home";
                         localStorage.setItem('token', response.token);
                     } else {
                         alert("invalid user or password");
                     }
                 });
         }
     };

 });

 validationApp.controller('employeeListCtrl', function($scope, $http) {

     $('#emplist').dataTable({

         "bServerSide": true,
         "sAjaxSource": 'http://localhost:3000/employee/emplist',
         "bAutoWidth": false,
         "bProcessing": true,
         "bSort": true,
         "sPaginationType": "bootstrap",
         "bSearchable": true,
         "bFilter": true,
         "bDestroy": true,
         "lengthMenu": [
             [10, 25, 50, -1],
             [10, 25, 50, "All"]
         ],
         "iDisplayLength": 10,
         "aoColumns": [{
                 "mData": "name"
             }, {
                 "mData": "email"
             }, {
                 "mData": "contact"
             },
             /* {
                 "mData": null,
                 "fnRender": function(obj, nRow) {

                     var uniqId = obj.aData.id;
                     var editRemoveDiv = "<div class='btnStyle'><a class='btn btn-xs btn-teal hint--top hint--rounded hint--no-animate view' data-hint='View' onclick='viewApplication(" + uniqId + ")' id='applicationView" + uniqId + "'><i class='fa fa-eye'></i></a>";

                     return editRemoveDiv;
                 }
             } */
         ]
     });
 });

 validationApp.controller('employeeProfileCtrl', function($scope, $http) {

     $scope.isEdit = true;
     var token = localStorage.getItem('token');

     $http({
         method: 'GET',
         url: 'http://localhost:3000/employee/getProfile',
         data: '',
         headers: {
             'x-access-token': token
         }
     }).success(function(response) {
         console.log(response);
         $scope.employee = response.profile;
     });

     $scope.updateEmployee = function(form) {

         if ($scope.employeeForm.$valid) {
             $scope.empData = {
                 email: $scope.employee.email,
                 name: $scope.employee.name,
                 contact: $scope.employee.contact
             };

             var token = localStorage.getItem('token');

             $http({
                 method: 'put',
                 url: 'http://localhost:3000/employee/update',
                 data: $scope.empData,
                 headers: {
                     'x-access-token': token
                 }
             }).success(function(response) {
                 console.log("success");
                 console.log(response);
                 $scope.employee = {};
                 angular.copy({}, $scope.employee);
                 form.$setPristine();
                 if (response.success) {
                     window.location = "http://localhost:3000/employee/home";
                 } else {
                     alert("Something went wrong.");
                 }
             });
         }
     };

     $scope.deleteAcc = function() {

         $http({
             method: 'delete',
             url: 'http://localhost:3000/employee/deleteAccount',
             headers: {
                 'x-access-token': token
             }
         }).success(function(response) {
             console.log(response);
             if (response.success) {
                 window.location = "http://localhost:3000/";
             } else {
                 alert("Something went wrong.");
             }
         });
     }
 });