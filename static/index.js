// inject the terminal, connect to backend
const loadVideoList = () => {
	document.querySelector('#intro').remove()
	document.querySelector('#lock').remove()

    window.location = '/videos'
}

// login failure sequence + state reset
const loginFailure = el => {
	let parent = el.parentNode
	parent.classList.add('invalid')
	el.setAttribute('readonly', true)
	setTimeout(() => {
		parent.classList.remove('invalid')
		el.removeAttribute('readonly')
		el.value = ''
	}, 1000)
}

// login animation sequence
const loginSuccess = el => {
	el.parentNode.classList.add('valid')
	setTimeout(() => {
		let intro = document.createElement('div')
		intro.id = 'intro'
		document.body.appendChild(intro)
		setTimeout(loadVideoList, 1.5 * 1000)
	}, 1.5 * 1000)
}

// login tester
document
	.querySelector('#pwbox')
	.addEventListener('keyup', e => {
		if (e.keyCode === 13) {
			fetch(`/api/login?pw=${e.target.value}`)
				.then(r => r.json())
				.then(r => {
					if (r.success === true) {
						loginSuccess(e.target)
					} else {
						loginFailure(e.target)
					}
				})
				.catch(() => loginFailure(e.target))

		}
	})
