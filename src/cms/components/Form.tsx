import Component from 'inferno-component';
import createElement from 'inferno-create-element';
import { linkEvent } from 'inferno';
import { FormService } from '../services/Form';

function wut({ store, route }) {
    store.updateState({ route });
}

// store any image uploads until submission
function imageSelection(t) {
    t.formService.previewFile(function(file, content) {
        t.media.push({
            name: file.name,
            content
        });
    });
}

// submit the form
function formSubmission(t, event) {
    t.formService.submit(
        {
            token: t.context.api.getToken(),
            state: t.context.store.getState(),
            media: t.media
        }, 
        event
    )
    .then(res => {
        t.context.store.updateState({ route: 'index' });
    });
}

// Generic Form
// TODO: Split into New/Edit
export class Form extends Component<any, any> {
    formService;
    media = [];

	constructor(props, context?: any) {
		super(props, context);
        this.formService = FormService();
	}

    componentDidMount() {
        this.formService.formMount();
    }

    componentWillUnmount() {
        this.formService.formUnmount();
        this.formService = null;
        this.media = null;
    }

	render() {
        const state = this.context.store.getState();
        const { api, router, store } = this.context;
        return (
            <div>
                <div className="col-lg-7" id="new-post">
                    <div className="form-panel">
                        <div className="form-header">
                            <h4 className="mb"><i className="fa fa-angle-right"></i> { (state.route === 'new-post') ? `New Post` : `Edit Post`}</h4>
                            <h4 className="close" onClick={linkEvent('index', router.go)}>X</h4>
                        </div>
                        <form className="form-horizontal style-form" id="post-form" data-type={state.route}>
                            <div className="form-group">
                                <label className="col-sm-2 col-sm-2 control-label">Title</label>
                                <div className="col-sm-10">
                                    <input type="text" className="form-control" name="title" id="title" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-2 col-sm-2 control-label">
                                    Content
                                    <input type="file" id="uploadImage" style={{ display: 'none' }} onChange={this.formService.handleImageSelection} />
                                    <div class="content-upload-btn form-acc">
                                        <i className="fa fa-file-image-o"></i>
                                    </div>
                                </label>
                                <div className="col-sm-10">
                                    <textarea type="text" className="form-control" name="content" id="content" onInput={this.formService.changeEventHandler}></textarea>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-sm-2 col-sm-2 control-label">Cover Photo</label>
                                <div className="col-sm-10">
                                    <input type="file" className="form-control" name="file" id="file" onChange={linkEvent(this, imageSelection)} />
                                    <img src="" alt="Image preview..." id="file-preview" name="file-preview" />
                                </div>
                            </div>
                            <a class="ghost-btn purple" id="submit-btn" onClick={linkEvent(this, formSubmission)}>
                                <span>
                                    { (state.route === 'new-post') ? `Submit` : `Save`}
                                </span>
                            </a>
                            {
                                (state.route === 'edit')
                                    ? (<a class="ghost-btn red" id="delete-btn" onClick={linkEvent({ router, store }, this.formService.deletePost)}>
                                        <span>Delete</span>
                                    </a>)
                                    : null
                            }
                        </form>
                    </div>
                </div>
                <div className="col-lg-5" id="post-preview">
                    <span class="content">
                        <span class="preview">✨ Your post will preview here... ✨</span>
                    </span>
                </div>
            </div>
            );
	}
}