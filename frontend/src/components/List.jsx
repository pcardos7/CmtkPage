import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../BackEndData";

function ListComponent({ listData }) {
	const navigate = useNavigate();
	const [data, setData] = useState(listData);

	function handleRowClick(rowData) {
		navigate(`/ChartPage/${rowData.location}/${rowData.cmtk}`);
	}

	if (!data || data.length === 0) {
		return <p>No hay fallas por mostrar.</p>;
	}

	/**
	 * Updates the component's state with the provided list data.
	 * This function is called whenever the listData prop changes.
	 */
	useEffect(() => {
		setData(listData);
	}, [listData]);

	/**
	 * Deletes all entries in the list by making a DELETE request to the API.
	 * If the request is successful, it clears the local state.
	 */
	async function DeleteAll() {
		try {
			// Do the DELETE request to clear history
			const response = await fetch(API_ENDPOINTS.deleteHistory, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});
			// Show an error
			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}
			setData([]);
		} catch (error) {
			console.error("Delete failed:", error);
		}
	}

	return (
		<div className="container">
			<div className="row">
				<div className="col-12 mb-3 mb-lg-5">
					<div className="overflow-hidden card table-nowrap table-card">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">Ultimas Fallas</h5>
							<button type="button" className="btn btn-link" onClick={DeleteAll}>
								Borrar todo
							</button>
						</div>
						<div
							className="table-responsive"
							style={{
								maxHeight: "300px",
								overflowY: "auto",
							}}
						>
							<table className="table mb-0">
								<thead className="small text-uppercase bg-body text-muted">
									<tr>
										<th>Ubicacion</th>
										<th>CMTK</th>
										<th>Port</th>
										<th>Tipo de Falla</th>
										<th>Hora</th>
									</tr>
								</thead>
								<tbody>
									{data.map(({ area, cmtk, port, failure, date }, index) => (
										<tr
											key={index}
											className="align-middle"
											onClick={() =>
												handleRowClick({
													area,
													cmtk,
												})
											}
										>
											<td>
												<div className="h6 mb-0 lh-1">{area}</div>
											</td>
											<td>{cmtk}</td>
											<td>
												<div className="h6 mb-0 lh-1">{port}</div>
											</td>
											<td>
												<span className="d-inline-block align-middle">{failure}</span>
											</td>
											<td>
												<span className="d-inline-block align-middle">{date}</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ListComponent;
