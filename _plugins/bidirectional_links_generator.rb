# frozen_string_literal: true

class BidirectionalLinksGenerator < Jekyll::Generator
  def generate(site)
    graph_nodes = []
    graph_edges = []

    all_notes = site.collections['notes'].docs
    all_pages = site.pages

    all_docs = all_notes + all_pages

    link_extension = site.config["use_html_extension"] ? ".html" : ""

    # Convert all Wiki/Roam-style double-bracket links
    all_docs.each do |current_note|
      all_docs.each do |note_potentially_linked_to|
        title_from_filename = File.basename(
          note_potentially_linked_to.basename,
          File.extname(note_potentially_linked_to.basename)
        ).gsub('_', ' ').gsub('-', ' ').downcase

        title_from_data = note_potentially_linked_to.data['title']&.downcase

        new_href = "#{site.baseurl}#{note_potentially_linked_to.url}#{link_extension}"
        anchor_tag = "<a class='internal-link' href='#{new_href}'>\\1</a>"

        # Replace [[Title|Display Text]] format
        current_note.content = current_note.content.gsub(
          /\[\[#{title_from_filename}\|(.+?)\]\]/i,
          anchor_tag
        )

        current_note.content = current_note.content.gsub(
          /\[\[#{title_from_data}\|(.+?)\]\]/i,
          anchor_tag
        ) unless title_from_data.nil?

        # Replace [[Title]] format
        current_note.content = current_note.content.gsub(
          /\[\[(#{title_from_filename})\]\]/i,
          anchor_tag
        )

        current_note.content = current_note.content.gsub(
          /\[\[(#{title_from_data})\]\]/i,
          anchor_tag
        ) unless title_from_data.nil?
      end

      # Mark remaining double-bracket links as invalid
      current_note.content = current_note.content.gsub(
        /\[\[(.+?)\]\]/i,
        <<~HTML.chomp
          <span class='invalid-link'>
            <span class='invalid-link-brackets'>[[</span>
            \\1
            <span class='invalid-link-brackets'>]]</span>
          </span>
        HTML
      )
    end

    # Identify backlinks and generate graph data
    all_notes.each do |current_note|
      notes_linking_to_current_note = all_notes.filter do |e|
        e.content.include?(current_note.url)
      end

      current_note.data['backlinks'] = notes_linking_to_current_note

      graph_nodes << {
        id: note_id_from_note(current_note),
        path: "#{site.baseurl}#{current_note.url}#{link_extension}",
        label: current_note.data['title'] || current_note.basename,
      } unless current_note.path.include?('_notes/index.html')

      notes_linking_to_current_note.each do |n|
        graph_edges << {
          source: note_id_from_note(n),
          target: note_id_from_note(current_note),
        }
      end
    end

    File.write('_includes/notes_graph.json', JSON.dump({
      edges: graph_edges,
      nodes: graph_nodes,
    }))
  end

  def note_id_from_note(note)
    note.data['title']&.bytes&.join || note.basename.bytes.join
  end
end
