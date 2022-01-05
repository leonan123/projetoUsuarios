class UserController {
    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formCreateEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    onEdit() {
        document.querySelector('#box-user-update .btn-cancel').addEventListener('click', e => {
            this.showAndHidePanel(document.querySelector('#box-user-create'), document.querySelector('#box-user-update'))
        });

        this.formUpdateEl.addEventListener('submit', event => {
            event.preventDefault();

            let btn = this.formUpdateEl.querySelector('[type=submit]');

            btn.disabled = true;

            let values = this.getValues(this.formUpdateEl);

            console.log(values);

            let index = this.formUpdateEl.dataset.trIndex;
            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);



            this.getPhoto(this.formUpdateEl).then((content) => {

                if (!values.photo) {
                    result._photo = userOld._photo;
                } else {
                    result._photo = content;
                }

                let user = new User();

                user.loadFromJSON(result);

                user.save();

                this.getTr(user, tr);

                this.updateCount();

                this.formUpdateEl.reset();

                btn.disabled = false;

                this.showAndHidePanel(document.querySelector('#box-user-create'), document.querySelector('#box-user-update'))
            }, (error) => {
                console.error(error);
            })

        })
    }

    onSubmit() {
        this.formCreateEl.addEventListener('submit', event => {
            event.preventDefault();

            let btn = document.querySelector('[type="submit"]');

            btn.disabled = true;

            let values = this.getValues(this.formCreateEl);
            if (!values) return false;

            this.getPhoto(this.formCreateEl).then((content) => {
                values.photo = content;

                values.save();

                this.addLineUser(values);

                this.formCreateEl.reset();

                btn.disabled = false;

            }, (error) => {
                console.error(error);
            })

        })
    }

    getPhoto(formEl) {

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item => {
                if (item.name === "photo") {
                    return item;
                }
            })

            let file = elements[0].files[0];

            fileReader.onload = () => {
                resolve(fileReader.result);
            }

            fileReader.onerror = (error) => {
                reject(error);
            }

            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                resolve('dist/img/boxed-bg.jpg');
            }
        })

    }

    getValues(formEl) {
        let user = {};
        let isValid = true;

        [...formEl.elements].forEach((field) => {

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {
                field.parentElement.classList.add('has-error');
                isValid = false;
            } else {
                field.parentElement.classList.remove('has-error');
            }

            if (field.name == 'gender') {
                if (field.checked) {
                    user[field.name] = field.value;
                }
            }
            else if (field.name == 'admin') {
                user[field.name] = field.checked;
            }
            else {
                user[field.name] = field.value;
            }
        })

        if (!isValid) {
            return false;
        }

        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin,
        );

    }


    selectAll() {

        let users = User.getUsersStorage();

        users.forEach(dataUser => {

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLineUser(user);
        })


    }

    addLineUser(data) {

        let tr = this.getTr(data);

        this.tableEl.appendChild(tr);

        this.updateCount();

    }

    getTr(dataUser, tr = null) {

        if (tr === null) tr = document.createElement("tr");

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
        <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
        <td>${dataUser.name}</td>
        <td>${dataUser.email}</td>
        <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
        <td>${Utils.dateFormat(dataUser.register)}</td>
        <td>
            <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
            <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
         </td>
    `;

        this.addEventsTR(tr);

        return tr;
    }

    addEventsTR(tr) {

        tr.querySelector('.btn-delete').addEventListener('click', e => {

            if (confirm('Deseja realmente excluir?')) {

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();
            }

        });

        tr.querySelector('.btn-edit').addEventListener('click', e => {


            let json = JSON.parse(tr.dataset.user);
            let form = document.querySelector('#form-user-update');

            form.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {
                let field = form.querySelector(`[name=${name.replace("_", "")}]`);
                if (field) {

                    switch (field.type) {
                        case 'file':
                            continue;
                            break;

                        case 'radio':
                            field = form.querySelector(`[name=${name.replace("_", "")}][value=${json[name]}]`);
                            field.checked = true;
                            break;

                        case 'checkbox':
                            field.checked = json[name];
                            break;

                        default:
                            field.value = json[name];
                    }
                }
            }



            this.formUpdateEl.querySelector(".photo").src = json._photo;

            this.showAndHidePanel(document.querySelector('#box-user-update'), document.querySelector('#box-user-create'))

        });
    }

    showAndHidePanel(show, hide) {
        show.style.display = "block";
        hide.style.display = "none";
    }

    updateCount() {

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {

            numberUsers++;

            let user = JSON.parse(tr.dataset.user)

            if (user._admin) numberAdmin++;
        });

        document.getElementById('number-users').innerHTML = numberUsers;
        document.getElementById('number-users-admin').innerHTML = numberAdmin;

    }

}