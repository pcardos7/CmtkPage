import Card from "./Card";
/**
 * This component displays a gallery with multiple cards
 *
 * @param {Object.<string, string>} elements - An object where each key is a card title and each value is its description.
 * @returns {JSX.Element} The Gallery component JSX.
 */
function Album({ elements, descriptions }) {
    return (
        <div
            className="album mx-auto"
            style={{
                maxWidth: "90%",
                overflowX: "hidden",
                backgroundColor: "green",
            }}
        >
            <div className="container-fluid cards-container">
                <div className="d-flex row row-cols-sm-2 row-cols-md-3 g-3 p-2 justify-content-center">
                    {Object.entries(elements).map(([key, value], index) => (
                        <div className="col" key={key}>
                            <Card
                                title={value}
                                description={descriptions[index]}
                                selected={value}
                            ></Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Album;
