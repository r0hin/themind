export default function Page({ params }) {
    const id = params.id;

    return (
        <p>Game ID: {id}</p>
    )
}