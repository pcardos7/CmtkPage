function HeaderComponent({ label }) {
	return (
		<h2 className="d-block ps-4 pt-3" style={{ backgroundColor: "#202528", color: "white" }}>
			{label}
		</h2>
	);
}

export default HeaderComponent;
